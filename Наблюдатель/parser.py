# -*- coding: utf-8 -*-
"""
Парсер товаров с n-23.ru → XML/JSON
Собирает: все фото, описания, характеристики, цены, паспорта (PDF)
Обходит все категории и подкатегории автоматически

Запуск: python parser.py
Результат: output/ с папочной структурой + products_all.xml/json
"""
import requests
from bs4 import BeautifulSoup
import os, sys, io, re, json, time
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent
from xml.sax.saxutils import escape as xml_escape
import shutil
from urllib.parse import urljoin
import hashlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0'}
SITE = 'https://n-23.ru'
REQUEST_DELAY = 0.3  # секунд между запросами

# ═══════════════════════════════════════════
# ПРОГРЕСС-БАР
# ═══════════════════════════════════════════

class Progress:
    def __init__(self, total, label=''):
        self.total = max(total, 1)
        self.current = 0
        self.label = label
        self.start_time = time.time()
        self.width = min(40, shutil.get_terminal_size((80, 20)).columns - 45)

    def update(self, n=1, extra=''):
        self.current += n
        pct = self.current / self.total
        filled = int(self.width * pct)
        bar = '█' * filled + '░' * (self.width - filled)
        elapsed = time.time() - self.start_time
        if self.current > 0 and elapsed > 0:
            speed = self.current / elapsed
            eta = (self.total - self.current) / speed if speed > 0 else 0
            eta_str = f'{int(eta // 60)}м{int(eta % 60):02d}с' if eta >= 60 else f'{int(eta)}с'
        else:
            eta_str = '...'
        info = extra[:20] if extra else ''
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} ({pct:.0%}) ETA: {eta_str} {info}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        sys.stdout.flush()

    def set_total(self, total):
        self.total = max(total, 1)

    def done(self, msg=''):
        bar = '█' * self.width
        elapsed = time.time() - self.start_time
        elapsed_str = f'{int(elapsed // 60)}м{int(elapsed % 60):02d}с' if elapsed >= 60 else f'{elapsed:.0f}с'
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} (100%) за {elapsed_str} ✅ {msg}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        print()


# ═══════════════════════════════════════════
# HTTP
# ═══════════════════════════════════════════

session = requests.Session()
session.headers.update(HEADERS)


def get_page(url, retries=2):
    """GET-запрос с повторами"""
    for attempt in range(retries + 1):
        try:
            r = session.get(url, timeout=20)
            r.raise_for_status()
            return r.text
        except Exception:
            if attempt < retries:
                time.sleep(1)
    return None


def get_soup(url):
    html = get_page(url)
    if html:
        return BeautifulSoup(html, 'html.parser')
    return None


# ═══════════════════════════════════════════
# ФАЗА 1: СБОР КАТЕГОРИЙ С САЙТА
# ═══════════════════════════════════════════

def discover_categories():
    """Автоматически найти все категории из бокового меню сайта"""
    print('  Загрузка главной страницы для сбора категорий...')
    soup = get_soup(SITE + '/catalogue/')
    if not soup:
        soup = get_soup(SITE)
    if not soup:
        print('  ❌ Не удалось загрузить сайт')
        return {}

    categories = {}

    # Ищем боковое меню каталога
    sidebar = soup.select('ul.sidebar__menu_catalog > li > a')
    if sidebar:
        for a in sidebar:
            href = a.get('href', '')
            name = a.get_text(strip=True)
            if href and name and '/catalogue/' in href:
                # Нормализуем URL — убираем домен, оставляем путь
                path = href.replace(SITE, '').replace('https://n-23.ru', '')
                if not path.startswith('/'):
                    path = '/' + path
                categories[name] = path

    # Fallback: ищем ссылки на каталог из навигации
    if not categories:
        for a in soup.find_all('a', href=True):
            href = a['href']
            name = a.get_text(strip=True)
            # Относительные
            if re.match(r'^/catalogue/[a-z_]+/?$', href) and name and len(name) > 2:
                categories[name] = href.rstrip('/')
            # Полные URL
            m = re.match(r'https://n-23\.ru(/catalogue/[a-z_]+)/?$', href)
            if m and name and len(name) > 2:
                categories[name] = m.group(1)

    # Дедупликация: если несколько имён ведут на один path — оставляем первое
    seen_paths = {}
    deduped = {}
    for name, path in categories.items():
        if path not in seen_paths:
            seen_paths[path] = name
            deduped[name] = path
    return deduped


def discover_subcategories(url):
    """Найти подкатегории на странице категории"""
    soup = get_soup(url)
    if not soup:
        return []

    subs = []
    seen = set()

    # Способ 1: слайдер подкатегорий
    for a in soup.select('ul.categories-slider li.categories-slider-item a'):
        href = a.get('href', '')
        if href:
            full = href if href.startswith('http') else SITE + href
            if full not in seen and '/i_' not in full:
                seen.add(full)
                subs.append(full)

    # Способ 2: ссылки на подкатегории в контенте
    base_path = url.replace(SITE, '').replace('https://n-23.ru', '').rstrip('/').split('?')[0]
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/'):
            full = SITE + href
        elif href.startswith('http') and 'n-23.ru' in href:
            full = href
        else:
            continue

        clean = full.replace(SITE, '').replace('https://n-23.ru', '').rstrip('/').split('?')[0]
        if (clean.startswith(base_path + '/')
                and clean != base_path
                and '/i_' not in clean
                and full not in seen
                and '?' not in full):
            seen.add(full)
            subs.append(full)

    return subs


# ═══════════════════════════════════════════
# ФАЗА 2: СБОР ССЫЛОК НА ТОВАРЫ
# ═══════════════════════════════════════════

def find_product_links_in_html(html):
    """Найти все ссылки на товары в HTML (полные и относительные URL)"""
    links = set()
    # Полные URL
    for m in re.findall(r'https://n-23\.ru/catalogue/[^"\'\s>]+/i_\d+', html):
        links.add(m.rstrip('/'))
    # Относительные URL
    for m in re.findall(r'href="(/catalogue/[^"]*?/i_\d+)"', html):
        links.add(SITE + m.rstrip('/'))
    return links


def get_max_page(html):
    """Найти максимальный номер страницы из пагинации"""
    max_pg = 1
    for m in re.findall(r'\?page=(\d+)', html):
        n = int(m)
        if n > max_pg:
            max_pg = n
    return max_pg


def collect_all_products(base_url, label=''):
    """Собрать ВСЕ товары со всех страниц пагинации"""
    all_links = set()

    # Первая страница — узнаём общее количество страниц
    sep = '&' if '?' in base_url else '?'
    html = get_page(base_url)
    if not html:
        return list(all_links)

    all_links.update(find_product_links_in_html(html))
    max_page = get_max_page(html)

    if max_page > 1 and label:
        sys.stdout.write(f'\r    ↳ {label}: стр 1/{max_page} ({len(all_links)} товаров)...')
        sys.stdout.flush()

    # Проходим остальные страницы
    for page in range(2, max_page + 1):
        url = f'{base_url}{sep}page={page}'
        html = get_page(url)
        if not html:
            break

        links = find_product_links_in_html(html)
        all_links.update(links)
        time.sleep(REQUEST_DELAY)

        if label and page % 5 == 0:
            sys.stdout.write(f'\r    ↳ {label}: стр {page}/{max_page} ({len(all_links)} товаров)...')
            sys.stdout.flush()

    if max_page > 1 and label:
        sys.stdout.write(f'\r    ↳ {label}: {max_page} стр → {len(all_links)} товаров              \n')
        sys.stdout.flush()

    return list(all_links)


def collect_category_with_subs(cat_url, cat_name=''):
    """Собрать товары из категории + один уровень подкатегорий (без глубокой рекурсии)"""
    all_links = set()

    # Товары с главной страницы категории (все стр. пагинации)
    products = collect_all_products(cat_url, label=cat_name)
    all_links.update(products)

    # Один уровень подкатегорий
    subs = discover_subcategories(cat_url)
    for sub_url in subs:
        time.sleep(REQUEST_DELAY)
        sub_name = sub_url.rstrip('/').split('/')[-1]
        sub_products = collect_all_products(sub_url, label=f'  {sub_name}')
        new = set(sub_products) - all_links
        all_links.update(sub_products)
        if new:
            print(f'      + {len(new)} новых из подкатегории {sub_name}')

    return all_links


# ═══════════════════════════════════════════
# ФАЗА 3: ПАРСИНГ ТОВАРА
# ═══════════════════════════════════════════

BRANDS = [
    'Hikvision', 'HiWatch', 'Dahua', 'Uniview', 'Tiandy', 'IMOU', 'EZVIZ',
    'FOX', 'iFLOW', 'Accordtec', 'ZKTeco', 'DoorHan', 'CAME', 'BFT',
    'Optimus', 'Tantos', 'CTV', 'Falcon Eye', 'Polyvision', 'Bolid',
    'Atix', 'Ajax', 'Slinex', 'NOVIcam', 'RVi', 'EZ-IP', 'ActiveCam',
    'Space Technology', 'Trassir', 'ProFvideo', 'ComOnyx', 'AN-Motors',
    'KENO', 'ViGUARD', 'Pyronix', 'Smartec', 'CAME', 'NICE', 'Nedap',
    'Milestone', 'Axis', 'Arecont', 'Mobotix', 'Vivotek', 'Geovision',
    'Wisenet', 'Samsung', 'Seagate', 'Western Digital', 'Toshiba',
]


def detect_brand(name, schema_brand=''):
    """Определить бренд: сначала из schema.org, потом из названия"""
    if schema_brand:
        # Проверяем что schema_brand — реальный бренд
        for b in BRANDS:
            if b.lower() == schema_brand.lower():
                return b
        # Даже если не в списке — доверяем сайту
        if len(schema_brand) > 1 and schema_brand not in ('Другое', 'другое'):
            return schema_brand

    name_low = name.lower()
    for b in BRANDS:
        if b.lower() in name_low:
            return b

    # По первому слову
    first_word = name.split()[0] if name else ''
    for b in BRANDS:
        if first_word.lower() == b.lower():
            return b

    return 'Другое'


def parse_product(url):
    """Парсинг одного товара — полная информация"""
    soup = get_soup(url)
    if not soup:
        return None

    p = {'url': url}

    # ── Schema.org данные (самые надёжные) ──
    schema_name = ''
    schema_sku = ''
    schema_desc = ''
    schema_brand = ''
    schema_price = ''
    schema_category = ''

    meta_name = soup.find('meta', attrs={'itemprop': 'name'})
    if meta_name:
        schema_name = meta_name.get('content', '')

    meta_sku = soup.find('meta', attrs={'itemprop': 'sku'})
    if meta_sku:
        schema_sku = meta_sku.get('content', '')

    meta_desc = soup.find('meta', attrs={'itemprop': 'description'})
    if meta_desc:
        schema_desc = meta_desc.get('content', '')

    meta_cat = soup.find('meta', attrs={'itemprop': 'category'})
    if meta_cat:
        schema_category = meta_cat.get('content', '')

    brand_div = soup.find(attrs={'itemprop': 'brand'})
    if brand_div:
        brand_meta = brand_div.find('meta', attrs={'itemprop': 'name'})
        if brand_meta:
            schema_brand = brand_meta.get('content', '')

    price_meta = soup.find('meta', attrs={'itemprop': 'price'})
    if price_meta:
        schema_price = price_meta.get('content', '')

    # ── Название ──
    h1 = soup.find('h1')
    h1_text = h1.get_text(strip=True) if h1 else ''

    # h3 с itemprop=name часто содержит чистое имя "Brand Model"
    h3 = soup.find('h3', attrs={'itemprop': 'name'})
    h3_text = h3.get_text(strip=True) if h3 else ''

    # Приоритет: h3 (чистое), schema_name, h1 (с категорией)
    if h3_text:
        p['name'] = h3_text
    elif schema_name:
        p['name'] = schema_name
    elif h1_text:
        # h1 формата "Категория - Бренд, Модель"
        if ' - ' in h1_text:
            p['name'] = h1_text.split(' - ', 1)[1].strip()
        else:
            p['name'] = h1_text
    else:
        return None

    # ── Артикул ──
    p['id'] = schema_sku
    if not p['id']:
        m = re.search(r'i_(\d+)', url)
        p['id'] = m.group(1) if m else ''

    # Артикул из тега с классом warr: "Гарантия -- 1 год (Арт. 10415)"
    warr_tag = soup.find('i', class_='warr') or soup.find('small', class_='warr')
    p['warranty'] = ''
    if warr_tag:
        warr_text = warr_tag.get_text(strip=True)
        # Извлечь гарантию
        wm = re.search(r'Гарантия\s*[-–—]+\s*(.+?)(?:\(|$)', warr_text)
        if wm:
            p['warranty'] = wm.group(1).strip()
        # Артикул из скобок
        am = re.search(r'\(Арт\.\s*(\d+)\)', warr_text)
        if am and not p['id']:
            p['id'] = am.group(1)

    # Модель — из названия, после запятой (Brand, Model)
    if ',' in p['name']:
        parts = p['name'].split(',', 1)
        p['article'] = parts[1].strip()
        p['brand_from_name'] = parts[0].strip()
    else:
        p['article'] = p['name']
        p['brand_from_name'] = ''

    # ── Бренд ──
    p['brand'] = detect_brand(p['name'], schema_brand)

    # ── Цена ──
    p['price'] = schema_price
    if not p['price']:
        cost_div = soup.select_one('div.cat__list_cost')
        if cost_div:
            price_text = cost_div.get_text(strip=True).replace('\xa0', ' ')
            m = re.search(r'([\d\s]+)', price_text)
            if m:
                p['price'] = m.group(1).replace(' ', '').strip()

    # ── Наличие ──
    p['availability'] = ''
    avail = soup.select_one('div.cat__list_count a')
    if avail:
        p['availability'] = avail.get_text(strip=True)
        # Количество из tooltip
        tip = avail.get('data-original-title', '')
        if tip:
            p['availability_detail'] = tip

    # ── Фотографии (все из галереи — полноразмерные) ──
    p['images'] = []
    seen_imgs = set()

    # Способ 1: lightgallery — самый надёжный, полноразмерные фото
    gallery = soup.select('div.lightgallery a[href]')
    if gallery:
        for a in gallery:
            href = a.get('href', '')
            if href and ('/storage/' in href or '/img_cat/' in href):
                full = urljoin(SITE, href)
                if full not in seen_imgs:
                    p['images'].append(full)
                    seen_imgs.add(full)

    # Способ 2: Vue-компонент product-gallery-carousel
    if not p['images']:
        carousel = soup.find('product-gallery-carousel')
        if carousel:
            imgs_json = carousel.get('images', '')
            try:
                imgs_data = json.loads(imgs_json)
                for img_obj in imgs_data:
                    src = img_obj.get('src', '') or img_obj.get('url', '')
                    if src:
                        full = urljoin(SITE, src)
                        if full not in seen_imgs:
                            p['images'].append(full)
                            seen_imgs.add(full)
            except (json.JSONDecodeError, TypeError):
                pass

    # Способ 3: img с itemprop=image
    if not p['images']:
        for img in soup.find_all('img', attrs={'itemprop': 'image'}):
            src = img.get('src', '') or img.get('data-src', '')
            if src:
                full = urljoin(SITE, src)
                # Убираем превью _250x250
                full = re.sub(r'_\d+x\d+\.', '.', full)
                if full not in seen_imgs:
                    p['images'].append(full)
                    seen_imgs.add(full)

    # Способ 4: fallback — все img из /storage/ и /img_cat/
    if not p['images']:
        for img in soup.find_all('img'):
            src = img.get('src', '') or img.get('data-src', '')
            if src and ('/storage/' in src or '/img_cat/' in src):
                full = urljoin(SITE, src)
                full = re.sub(r'_\d+x\d+\.', '.', full)
                if full not in seen_imgs:
                    p['images'].append(full)
                    seen_imgs.add(full)

    # ── Паспорт (PDF) ──
    p['passports'] = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True).lower()
        if '/storage/passport/' in href or (href.endswith('.pdf') and 'паспорт' in text):
            full = urljoin(SITE, href)
            if full not in p['passports']:
                p['passports'].append(full)
    # Также ищем в блоке product-passport
    for a in soup.select('div.product-passport a[href]'):
        full = urljoin(SITE, a['href'])
        if full not in p['passports']:
            p['passports'].append(full)

    # ── Характеристики ──
    p['specs'] = {}

    # Блок "Технические характеристики"
    for div in soup.select('div.cat__list_text_anons'):
        h5 = div.find('h5')
        if h5 and 'характеристик' in h5.get_text(strip=True).lower():
            for tr in div.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 2:
                    k = tds[0].get_text(strip=True)
                    v = tds[1].get_text(strip=True)
                    if k and v and len(k) < 100 and len(v) < 1000:
                        p['specs'][k] = v

    # Fallback: любые таблицы с парами ключ-значение
    if not p['specs']:
        for table in soup.find_all('table'):
            for tr in table.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 2:
                    k = tds[0].get_text(strip=True)
                    v = tds[1].get_text(strip=True)
                    if k and v and len(k) < 100 and len(v) < 1000:
                        p['specs'][k] = v

    # ── Описание ──
    p['description'] = ''

    # Способ 1: schema.org description
    if schema_desc and len(schema_desc) > 20:
        p['description'] = schema_desc.strip()

    # Способ 2: блок "Описание" на странице
    if not p['description']:
        desc_block = soup.select_one('div.description-block')
        if desc_block:
            # Может содержать таблицу или текст
            tables = desc_block.find_all('table')
            if tables:
                parts = []
                for table in tables:
                    for tr in table.find_all('tr'):
                        tds = tr.find_all('td')
                        if len(tds) >= 2:
                            k = tds[0].get_text(strip=True)
                            v = tds[1].get_text(strip=True)
                            if k and v:
                                parts.append(f'{k}: {v}')
                        elif len(tds) == 1:
                            t = tds[0].get_text(strip=True)
                            if t:
                                parts.append(t)
                if parts:
                    p['description'] = '\n'.join(parts)
            else:
                text = desc_block.get_text(separator='\n', strip=True)
                if len(text) > 20:
                    p['description'] = text

    # Способ 3: div с классом description/detail
    if not p['description']:
        for div in soup.find_all('div'):
            cls = ' '.join(div.get('class', []))
            if re.search(r'description|detail|about', cls, re.I):
                text = div.get_text(separator='\n', strip=True)
                if len(text) > 30:
                    # Убираем рекламные тексты
                    text = re.sub(r'Продажа.+?"Наблюдатель"\.?', '', text)
                    text = re.sub(r'Камеры видеонаблюдения.+?охранного видеонаблюдения\.?', '', text)
                    p['description'] = text.strip()[:3000]
                    break

    # ── Категория из schema.org ──
    p['schema_category'] = schema_category

    return p


# ═══════════════════════════════════════════
# ЭКСПОРТ
# ═══════════════════════════════════════════

def make_safe_dirname(name):
    """Безопасное имя для папки"""
    safe = re.sub(r'[<>:"/\\|?*]', '', name).strip()
    return safe[:200] or 'Без названия'


def build_product_xml(p):
    """Создать XML-элемент одного товара"""
    prod = Element('product')

    SubElement(prod, 'name').text = p.get('name', '')
    SubElement(prod, 'article').text = p.get('article', '')
    SubElement(prod, 'id').text = str(p.get('id', ''))
    SubElement(prod, 'brand').text = p.get('brand', '')
    SubElement(prod, 'category').text = p.get('category', '')
    SubElement(prod, 'price').text = str(p.get('price', ''))
    SubElement(prod, 'warranty').text = p.get('warranty', '')
    SubElement(prod, 'availability').text = p.get('availability', '')

    imgs = SubElement(prod, 'images')
    for img in p.get('images', []):
        SubElement(imgs, 'image').text = img
    for img in p.get('local_images', []):
        SubElement(imgs, 'local_image').text = img

    passports = SubElement(prod, 'passports')
    for pdf in p.get('passports', []):
        SubElement(passports, 'passport').text = pdf
    for pdf in p.get('local_passports', []):
        SubElement(passports, 'local_passport').text = pdf

    SubElement(prod, 'description').text = p.get('description', '')

    specs = SubElement(prod, 'specs')
    for k, v in p.get('specs', {}).items():
        # Безопасное имя атрибута
        safe_k = re.sub(r'[^\w.\- ]', '', k).strip()
        if safe_k:
            SubElement(specs, 'spec', name=safe_k).text = v

    SubElement(prod, 'source_url').text = p.get('url', '')
    return prod


def download_file(file_url, dest_path):
    """Скачать файл, если не существует"""
    if os.path.exists(dest_path):
        return True
    try:
        r = session.get(file_url, timeout=15)
        if r.status_code == 200 and len(r.content) > 100:
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            return True
    except Exception:
        pass
    return False


def export_all(products):
    """Экспорт в папочную структуру + XML/JSON"""
    print(f'\n{"=" * 50}')
    print(f'📁 ЭКСПОРТ В ПАПКИ + XML')
    print(f'{"=" * 50}')

    OUT = os.path.join(BASE_DIR, 'output')
    os.makedirs(OUT, exist_ok=True)

    # Группируем: категория → бренд → товары
    tree = {}
    for p in products:
        cat = p.get('category', 'Без категории')
        brand = p.get('brand', 'Другое')
        tree.setdefault(cat, {}).setdefault(brand, []).append(p)

    # Статистика
    print()
    total_brands = 0
    for cat in sorted(tree.keys()):
        brands = tree[cat]
        total = sum(len(v) for v in brands.values())
        total_brands += len(brands)
        print(f'  📁 {cat}: {total} товаров ({len(brands)} брендов)')
        for b in sorted(brands.keys()):
            print(f'      📂 {b}: {len(brands[b])}')

    # Скачивание фото и паспортов
    print('\n' + '-' * 50)
    total_files = sum(
        len(p.get('images', [])) + len(p.get('passports', []))
        for p in products
    )
    dl_files = '--no-download' not in sys.argv
    if dl_files:
        print(f'📥 Скачивание {total_files} файлов (фото + паспорта)...')
        print(f'   (запустите с --no-download чтобы пропустить)')
    else:
        print(f'⏭️  Скачивание пропущено (--no-download). Файлов: {total_files}')

    total_work = total_files if dl_files else len(products)
    progress = Progress(total_work, 'Экспорт ')
    print()

    # Общий XML
    all_root = Element('catalog')
    all_root.set('date', datetime.now().strftime('%Y-%m-%d %H:%M'))
    all_root.set('total', str(len(products)))

    for cat_name in sorted(tree.keys()):
        cat_dir = os.path.join(OUT, make_safe_dirname(cat_name))
        os.makedirs(cat_dir, exist_ok=True)

        for brand_name in sorted(tree[cat_name].keys()):
            brand_dir = os.path.join(cat_dir, make_safe_dirname(brand_name))
            os.makedirs(brand_dir, exist_ok=True)

            for p in tree[cat_name][brand_name]:
                # Папка для каждого товара
                art_name = p.get('article', p.get('id', 'noart'))
                prod_dir = os.path.join(brand_dir, make_safe_dirname(art_name))
                os.makedirs(prod_dir, exist_ok=True)

                # Скачиваем фото
                p['local_images'] = []
                if dl_files:
                    for idx, img_url in enumerate(p.get('images', [])):
                        ext = os.path.splitext(img_url.split('?')[0])[1] or '.jpg'
                        if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                            ext = '.jpg'
                        fname = f'photo_{idx + 1}{ext}'
                        fpath = os.path.join(prod_dir, fname)
                        if download_file(img_url, fpath):
                            p['local_images'].append(fname)
                        progress.update(1, art_name[:15])

                    # Скачиваем паспорта
                    p['local_passports'] = []
                    for idx, pdf_url in enumerate(p.get('passports', [])):
                        fname = f'passport_{idx + 1}.pdf'
                        fpath = os.path.join(prod_dir, fname)
                        if download_file(pdf_url, fpath):
                            p['local_passports'].append(fname)
                        progress.update(1, art_name[:15])
                else:
                    p['local_images'] = []
                    p['local_passports'] = []
                    progress.update(1, art_name[:15])

                # XML для этого товара
                prod_xml = build_product_xml(p)
                indent(prod_xml)
                prod_xml_path = os.path.join(prod_dir, 'product.xml')
                ElementTree(prod_xml).write(prod_xml_path, encoding='utf-8', xml_declaration=True)

                # Добавляем в общий XML
                all_root.append(build_product_xml(p))

    progress.done(f'{len(products)} товаров')
    print()

    # Общий XML
    indent(all_root)
    all_xml_path = os.path.join(OUT, 'products_all.xml')
    ElementTree(all_root).write(all_xml_path, encoding='utf-8', xml_declaration=True)
    print(f'✅ Общий XML: {all_xml_path}')

    # Общий JSON
    json_path = os.path.join(OUT, 'products_all.json')
    json_products = []
    for p in products:
        jp = {
            'url': p.get('url', ''),
            'name': p.get('name', ''),
            'id': p.get('id', ''),
            'article': p.get('article', ''),
            'brand': p.get('brand', ''),
            'brand_from_name': p.get('brand_from_name', ''),
            'category': p.get('category', ''),
            'price': p.get('price', ''),
            'warranty': p.get('warranty', ''),
            'availability': p.get('availability', ''),
            'images': p.get('images', []),
            'local_images': p.get('local_images', []),
            'passports': p.get('passports', []),
            'local_passports': p.get('local_passports', []),
            'specs': p.get('specs', {}),
            'description': p.get('description', ''),
        }
        json_products.append(jp)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_products, f, ensure_ascii=False, indent=2)
    print(f'✅ Общий JSON: {json_path}')

    # Структура папок
    print(f'\n📂 Структура output/:')
    for cat_name in sorted(tree.keys()):
        cat_safe = make_safe_dirname(cat_name)
        brands = tree[cat_name]
        print(f'  📁 {cat_safe}/')
        for brand_name in sorted(brands.keys()):
            brand_safe = make_safe_dirname(brand_name)
            cnt = len(brands[brand_name])
            print(f'      📂 {brand_safe}/ ({cnt} товаров)')
            for p in brands[brand_name][:2]:
                art = make_safe_dirname(p.get('article', p.get('id', '?')))
                imgs = len(p.get('images', []))
                pdfs = len(p.get('passports', []))
                print(f'          📄 {art}/ (product.xml + {imgs} фото + {pdfs} паспорт)')
            if cnt > 2:
                print(f'          ... и ещё {cnt - 2}')

    return all_xml_path


# ═══════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════

def parse_all():
    print('╔══════════════════════════════════════════════════════╗')
    print('║  ПАРСЕР n-23.ru → XML/JSON                          ║')
    print('║  Фото + Описания + Характеристики + Паспорта        ║')
    print('╚══════════════════════════════════════════════════════╝')
    print()

    # ── Фаза 1: Автообнаружение категорий ──
    print('📋 ФАЗА 1: Обнаружение категорий...')
    print()

    categories = discover_categories()
    if not categories:
        print('  ❌ Категории не найдены. Проверьте доступ к сайту.')
        return []

    print(f'  Найдено категорий: {len(categories)}')
    for name, path in categories.items():
        print(f'    • {name}: {path}')
    print()

    # ── Фаза 2: Сбор ссылок на товары ──
    print(f'📋 ФАЗА 2: Сбор ссылок на товары из {len(categories)} категорий...')
    print()

    all_links = {}  # {url: category_name}
    seen_urls = set()

    for cat_name, cat_path in categories.items():
        cat_url = SITE + cat_path
        print(f'\n  📂 {cat_name}...')
        links = collect_category_with_subs(cat_url, cat_name=cat_name)

        new_count = 0
        for link in links:
            if link not in seen_urls:
                seen_urls.add(link)
                all_links[link] = cat_name
                new_count += 1

        print(f'  ✅ {cat_name}: {len(links)} товаров (новых: {new_count}, всего: {len(all_links)})')
        time.sleep(REQUEST_DELAY)

    print(f'\n  🎯 Всего найдено: {len(all_links)} товаров')
    print()

    # ── Фаза 3: Парсинг каждого товара ──
    print(f'📦 ФАЗА 3: Парсинг {len(all_links)} товаров...')
    print()

    prod_progress = Progress(len(all_links), 'Товары  ')
    all_products = []
    errors = 0

    for link, cat_name in all_links.items():
        product = parse_product(link)
        if product and product.get('name'):
            product['category'] = cat_name
            all_products.append(product)
            prod_progress.update(1, product.get('article', '')[:18])
        else:
            errors += 1
            prod_progress.update(1, 'ошибка')

        time.sleep(REQUEST_DELAY)

    prod_progress.done(f'{len(all_products)} собрано, {errors} ошибок')
    print()

    # Статистика
    print('📊 По категориям:')
    cat_counts = {}
    for p in all_products:
        c = p.get('category', '?')
        cat_counts[c] = cat_counts.get(c, 0) + 1
    for c, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f'   {c}: {n}')

    print('\n📊 По брендам:')
    brand_counts = {}
    for p in all_products:
        b = p.get('brand', 'Другое')
        brand_counts[b] = brand_counts.get(b, 0) + 1
    for b, n in sorted(brand_counts.items(), key=lambda x: -x[1]):
        print(f'   {b}: {n}')

    with_photos = sum(1 for p in all_products if p.get('images'))
    with_specs = sum(1 for p in all_products if p.get('specs'))
    with_desc = sum(1 for p in all_products if p.get('description'))
    with_passport = sum(1 for p in all_products if p.get('passports'))
    print(f'\n📊 Покрытие:')
    print(f'   С фото: {with_photos}/{len(all_products)}')
    print(f'   С характеристиками: {with_specs}/{len(all_products)}')
    print(f'   С описанием: {with_desc}/{len(all_products)}')
    print(f'   С паспортом: {with_passport}/{len(all_products)}')

    return all_products


if __name__ == '__main__':
    products = parse_all()

    print(f'\n{"=" * 50}')
    print(f'📊 ИТОГО: {len(products)} товаров')
    print(f'{"=" * 50}')

    if products:
        export_all(products)

    print(f'\n{"=" * 50}')
    print(f'ГОТОВО!')
    print(f'{"=" * 50}')
