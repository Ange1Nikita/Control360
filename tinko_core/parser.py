# -*- coding: utf-8 -*-
"""
Парсер tinko.ru — ядро для всех брендов.
Сайт на Nuxt.js (SSR) — данные вшиты в HTML как JSON payload.
"""

import re
import json
import time
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from tinko_core.utils import get, safe_dirname, Progress

log = logging.getLogger('tinko')

SITE = 'https://www.tinko.ru'
REQUEST_DELAY = 0.3
PAGE_SIZE = 12  # товаров на странице поиска


# ==============================================
# NUXT PAYLOAD: разбор JSON из HTML
# ==============================================

def _extract_nuxt_payload(html: str) -> list | None:
    """Извлечь массив Nuxt payload из HTML"""
    m = re.search(
        r'<script type="application/json" id="__NUXT_DATA__"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    )
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def _resolve(data: list, idx: int, depth: int = 0):
    """Рекурсивно разрешить ссылки в Nuxt payload"""
    if depth > 20 or idx >= len(data):
        return None
    val = data[idx]
    if isinstance(val, list) and len(val) >= 2 and val[0] in ('Reactive', 'Ref', 'EmptyRef', 'Set'):
        if val[0] == 'EmptyRef':
            return None
        return _resolve(data, val[1], depth + 1)
    if isinstance(val, dict):
        return {k: _resolve(data, v, depth + 1) if isinstance(v, int) else v
                for k, v in val.items()}
    if isinstance(val, list):
        return [_resolve(data, v, depth + 1) if isinstance(v, int) else v
                for v in val]
    return val


def _build_display_name(raw_name: str, func_name: str, brand: str) -> str:
    """Собрать человекочитаемое имя товара.
    raw_name:  'DS-2CD2083G2-IU(2.8мм)'
    func_name: 'Профессиональная видеокамера IP цилиндрическая'
    brand:     'Hikvision'
    -> 'Видеокамера IP цилиндрическая Hikvision DS-2CD2083G2-IU (2.8мм)'
    """
    if not raw_name:
        return func_name or 'Без названия'

    # Чистим func_name: убираем "Профессиональная", "Бюджетная" и т.п. — лишние маркетинговые слова
    clean_func = func_name
    for prefix in ('Профессиональная ', 'Профессиональный ', 'Бюджетная ', 'Бюджетный '):
        if clean_func.startswith(prefix):
            clean_func = clean_func[len(prefix):]
            # Первая буква заглавная
            clean_func = clean_func[0].upper() + clean_func[1:] if clean_func else clean_func
            break

    if clean_func and brand:
        return f'{clean_func} {brand} {raw_name}'
    elif clean_func:
        return f'{clean_func} {raw_name}'
    elif brand:
        return f'{brand} {raw_name}'
    else:
        return raw_name


def _extract_specs_from_description(text: str) -> list[dict]:
    """Извлечь характеристики из текстового описания (для аксессуаров без структурированных спеков).
    Ищет паттерны: 'Размер: 137x53.4x164.8 мм', 'Материал - пластик', числа с единицами.
    """
    specs = []
    if not text:
        return specs

    # Паттерн "Ключ: значение" или "Ключ - значение"
    for m in re.finditer(r'([А-Яа-яA-Za-z][А-Яа-яA-Za-z\s]{2,30}?)\s*[:\-–—]\s*([^\n;,.]{2,80})', text):
        key = m.group(1).strip()
        val = m.group(2).strip()
        if key and val and len(key) < 50:
            specs.append({'name': key, 'value': val})

    # Размеры: "137x53.4x164.8 мм" или "Ø134×45 мм"
    size_m = re.search(r'(\d+[\.,]?\d*)\s*[xхX×]\s*(\d+[\.,]?\d*)(?:\s*[xхX×]\s*(\d+[\.,]?\d*))?\s*(мм|см|м)', text)
    if size_m and not any(s.get('name', '') == 'Размеры' for s in specs):
        specs.append({'name': 'Размеры', 'value': size_m.group(0).strip()})

    # Вес: "520 г" или "1.2 кг"
    weight_m = re.search(r'(\d+[\.,]?\d*)\s*(г|кг|грамм|килограмм)', text)
    if weight_m and not any(s.get('name', '') == 'Вес' for s in specs):
        specs.append({'name': 'Вес', 'value': weight_m.group(0).strip()})

    return specs


def _parse_search_page(html: str) -> tuple[list[dict], int]:
    """Разобрать страницу поиска, вернуть (products_summary, total_count)"""
    data = _extract_nuxt_payload(html)
    if not data:
        return [], 0

    main = _resolve(data, 5)
    if not main:
        return [], 0

    total = main.get('totalProductsCount', 0)

    # Индексы товаров — data[6] это массив индексов
    products_indices = data[6] if len(data) > 6 and isinstance(data[6], list) else []

    products = []
    for idx in products_indices:
        p = _resolve(data, idx)
        if p and isinstance(p, dict):
            products.append({
                'name': p.get('name', ''),
                'article': str(p.get('article', '')),
                'url': p.get('url', ''),
                'brand': p.get('brand', {}).get('name', '') if isinstance(p.get('brand'), dict) else '',
            })

    return products, total


# ==============================================
# СБОР ССЫЛОК НА ТОВАРЫ (поиск)
# ==============================================

def collect_search_products(query: str, brand_filter: str = '') -> list[dict]:
    """Собрать все товары из поиска tinko.ru по запросу.
    brand_filter — если указан, оставляем только товары этого бренда.
    """
    all_products = []
    seen = set()
    page = 1
    total = 0

    while True:
        url = f'{SITE}/search/?q={query}&count={PAGE_SIZE}&sort2=default'
        if page > 1:
            url += f'&PAGEN_1={page}'

        print(f'  [>] Страница {page}...', end=' ', flush=True)

        r = get(url)
        if not r:
            print('FAIL')
            break

        products, total = _parse_search_page(r.text)

        new_count = 0
        for p in products:
            art = p['article']
            if art in seen:
                continue

            # Фильтр по бренду (по вхождению — ловит суббренды типа "AX PRO Hikvision")
            if brand_filter and brand_filter.lower() not in p.get('brand', '').lower():
                continue

            seen.add(art)
            all_products.append(p)
            new_count += 1

        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE if total else 1
        print(f'{new_count} новых (всего: {len(all_products)}, стр {page}/{total_pages})')

        if page == 1:
            print(f'  [i] Найдено на tinko.ru: {total} результатов')

        if not products or page >= total_pages:
            break

        page += 1
        time.sleep(REQUEST_DELAY)

    return all_products


# ==============================================
# ПАРСИНГ КАРТОЧКИ ТОВАРА
# ==============================================

def parse_product_page(url: str) -> dict | None:
    """Спарсить полные данные товара со страницы tinko.ru/catalog/product/XXX/"""
    full_url = url if url.startswith('http') else SITE + url

    r = get(full_url)
    if not r:
        return None

    data = _extract_nuxt_payload(r.text)
    if not data:
        return None

    main = _resolve(data, 5)
    if not main:
        return None

    product = main.get('product', {})
    if not product:
        return None

    breadcrumbs = main.get('breadcrumbs', [])

    # Бренд
    brand_name = ''
    brand_data = product.get('brand', {})
    if isinstance(brand_data, dict):
        brand_name = brand_data.get('name', '')

    # Тип номенклатуры
    nomenclature = ''
    ntype = product.get('nomenclatureType', {})
    if isinstance(ntype, dict):
        nomenclature = ntype.get('name', '')

    # Человекочитаемое имя: "Видеокамера IP цилиндрическая Hikvision DS-2CD2083G2-IU(2.8мм)"
    raw_name = product.get('name', '')        # "DS-2CD2083G2-IU(2.8мм)"
    func_name = product.get('functionalName', '')  # "Профессиональная видеокамера IP цилиндрическая"
    display_name = _build_display_name(raw_name, func_name, brand_name)

    p = {
        'url': full_url,
        'name': display_name,
        'model': raw_name,
        'article': str(product.get('article', '')),
        'sku': str(product.get('manufacturerArticle', '')),
        'brand': brand_name,
        'category': '',
        'subcategory': '',
        'functional_name': func_name,
        'nomenclature': nomenclature,
        'description': product.get('detailText', ''),
        'availability': product.get('availability', ''),
        'price': '',
        'price_wholesale': '',
        'specs': [],
        'images': [],
        'passports': [],
    }

    # Категория из breadcrumbs
    # ['Главная', 'Каталог', 'Средства и системы...', 'Видеокамеры', 'IP-видеокамеры', 'Цилиндрические', 'Hikvision']
    crumb_labels = [b.get('label', '') for b in breadcrumbs if isinstance(b, dict)]
    # Пропускаем 'Главная', 'Каталог' и последний (бренд)
    meaningful = [c for c in crumb_labels if c.lower() not in ('главная', 'каталог', '')]
    if meaningful:
        # Убираем последний если совпадает с брендом
        if meaningful[-1].lower() == p['brand'].lower():
            meaningful = meaningful[:-1]
        if meaningful:
            p['category'] = meaningful[0]
        if len(meaningful) > 1:
            p['subcategory'] = meaningful[-1]

    # Цены
    prices = product.get('prices', [])
    if isinstance(prices, list):
        for price in prices:
            if not isinstance(price, dict):
                continue
            text = price.get('text', '').lower()
            val = price.get('price', 0)
            if 'розничн' in text:
                p['price'] = str(val)
            elif 'оптов' in text:
                p['price_wholesale'] = str(val)

    # Характеристики (из структурированных данных)
    chars = product.get('characteristics', [])
    if isinstance(chars, list):
        for ch in chars:
            if isinstance(ch, dict) and ch.get('name') and ch.get('value'):
                p['specs'].append({'name': ch['name'], 'value': ch['value']})

    # Если характеристик нет (аксессуары) — извлекаем из описания
    if not p['specs'] and p['description']:
        p['specs'] = _extract_specs_from_description(p['description'])

    # Изображения
    images = product.get('images', [])
    if isinstance(images, list):
        for img in images:
            if isinstance(img, dict):
                # Берём оригинал (big), не ресайз
                src = img.get('big') or img.get('src', '')
                if src:
                    full_src = src if src.startswith('http') else SITE + src
                    p['images'].append(full_src)

    # Документы (файлы: паспорта, инструкции)
    files = product.get('files', [])
    if isinstance(files, list):
        for f in files:
            if isinstance(f, dict) and f.get('url'):
                doc_url = f['url'] if f['url'].startswith('http') else SITE + f['url']
                p['passports'].append({
                    'url': doc_url,
                    'title': f.get('name', 'document'),
                    'download_name': f.get('downloadName', ''),
                    'size': f.get('size', ''),
                })

    return p


# ==============================================
# ПОЛНЫЙ ПАРСИНГ
# ==============================================

def parse_all(query: str, brand_name: str, brand_filter: str = '') -> list[dict]:
    """Полный парсинг: поиск + детальные страницы всех товаров"""
    print()
    print(f'[*] PHASE 1: Поиск товаров "{query}" на tinko.ru...')
    print()

    product_links = collect_search_products(query, brand_filter=brand_filter)

    if not product_links:
        log.error('Товары не найдены!')
        print('  [X] Товары не найдены.')
        return []

    print(f'\n  >> Товаров {brand_name}: {len(product_links)}')
    print()

    # Фаза 2: Парсинг каждого товара
    WORKERS = 10
    print(f'[*] PHASE 2: Парсинг {len(product_links)} товаров ({WORKERS} потоков)...')
    print()

    progress = Progress(len(product_links), 'Товары  ')
    all_products = []
    errors = 0
    lock = threading.Lock()

    def _parse_one(item):
        product = parse_product_page(item['url'])
        return product, item['url']

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(_parse_one, item): item for item in product_links}
        for future in as_completed(futures):
            product, url = future.result()
            with lock:
                if product:
                    all_products.append(product)
                    progress.update(product.get('name', '')[:18])
                else:
                    errors += 1
                    progress.update('err')
                    log.warning(f'Failed: {url}')

    progress.done(f'{len(all_products)} собрано, {errors} ошибок')
    print()

    # Статистика
    cat_counts = {}
    for p in all_products:
        c = p.get('category', '?')
        cat_counts[c] = cat_counts.get(c, 0) + 1

    print('[=] По категориям:')
    for c, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f'   {c}: {n}')

    with_photos = sum(1 for p in all_products if p.get('images'))
    with_specs = sum(1 for p in all_products if p.get('specs'))
    with_desc = sum(1 for p in all_products if p.get('description'))
    with_docs = sum(1 for p in all_products if p.get('passports'))
    with_price = sum(1 for p in all_products if p.get('price'))
    print(f'\n[=] Покрытие:')
    print(f'   С фото: {with_photos}/{len(all_products)}')
    print(f'   С характеристиками: {with_specs}/{len(all_products)}')
    print(f'   С описанием: {with_desc}/{len(all_products)}')
    print(f'   С документами: {with_docs}/{len(all_products)}')
    print(f'   С ценой: {with_price}/{len(all_products)}')

    return all_products
