# -*- coding: utf-8 -*-
"""
Парсер fox-cctv.ru → папки + XML
Быстрый сайт (~0.7с на страницу), ~200 товаров, ~3 минуты

Запуск: python parser_fox.py
"""
import requests
from bs4 import BeautifulSoup
import os, sys, io, re, json, time, shutil
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://www.fox-cctv.ru'
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

CATEGORIES = {
    'IP камеры': '/products/ip-kamery/',
    'IP регистраторы': '/products/ip-dvr/',
    'PoE коммутаторы': '/products/poe-kommutatory/',
    'TVI камеры': '/products/ahd-kamery/',
    'TVI камеры (CCTV)': '/products/cctv/ahd-kamery/',
    'IP камеры (CCTV)': '/products/cctv/ip-kamery/',
    'WiFi/4G камеры': '/products/cctv/wifi-4g-kamery/',
    'TVI регистраторы': '/products/ahd-dvr/',
    'Комплекты видеонаблюдения': '/products/video-komplekty/',
    'MHD домофоны': '/products/vd-dom/mhd-vd/',
    'IP домофоны': '/products/vd-dom/ip-vd/',
    'Домофоны комплекты': '/products/vd-dom/vd-komplekty/',
    'Вызывные панели': '/products/vd-dom/call-panel/',
    'Домофоны рамки': '/products/vd-dom/vd-ramki/',
    'Аудиотрубки': '/products/vd-dom/audiotrubki/',
    'HD домофоны': '/products/vd-dom/hd-vd/',
    'IP домофоны КОСМОС': '/products/vd-dom/ip-vd/ip-videodomofony-sozvezdie/',
    'Замки': '/products/locks/',
    'Кодонаборные панели': '/products/locks/code-collecting-panels/',
    'Умный дом': '/products/umnyy-dom/',
    'Аксессуары': '/products/aksessuary/',
    'Блоки питания': '/products/aksessuary/bloki-pitaniya/',
    'СКУД': '/products/locks/skud/',
}


class Progress:
    def __init__(self, total, label=''):
        self.total = max(total, 1)
        self.current = 0
        self.label = label
        self.start = time.time()
        self.w = min(35, shutil.get_terminal_size((80, 20)).columns - 50)

    def update(self, n=1, extra=''):
        self.current += n
        pct = self.current / self.total
        filled = int(self.w * pct)
        bar = '█' * filled + '░' * (self.w - filled)
        el = time.time() - self.start
        if self.current > 0 and el > 0:
            speed = self.current / el
            eta = (self.total - self.current) / speed
            es = f'{int(eta // 60)}м{int(eta % 60):02d}с' if eta >= 60 else f'{int(eta)}с'
        else:
            es = '...'
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} ({pct:.0%}) ETA:{es} {(extra or "")[:18]}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        sys.stdout.flush()

    def done(self, msg=''):
        el = time.time() - self.start
        es = f'{int(el // 60)}м{int(el % 60):02d}с'
        bar = '█' * self.w
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} (100%) {es} ✅ {msg}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        print()


def get(url):
    try:
        r = requests.get(url, headers=H, timeout=15)
        return r.text if r.status_code == 200 else None
    except:
        return None


def safe(name):
    return re.sub(r'[<>:"/\\|?*]', '', str(name)).strip()[:100] or 'noname'


# ═══════════════════════════════════════════
# ФАЗА 1: Сбор ссылок
# ═══════════════════════════════════════════

def collect_links():
    print('📋 ФАЗА 1: Сбор ссылок...')
    print(f'  Категорий: {len(CATEGORIES)}')
    print()

    prog = Progress(len(CATEGORIES), 'Категории')
    all_links = {}  # url -> cat_name

    for cat_name, cat_path in CATEGORIES.items():
        url = SITE + cat_path
        html = get(url)
        if not html:
            prog.update(1, cat_name[:15])
            continue

        # Ищем ссылки на товары — /products/.../slug-товара/
        for m in re.findall(r'href="(/products/[^"]+)"', html):
            # Товар: минимум 4 слеша, slug длиннее 5 символов
            parts = m.rstrip('/').split('/')
            if len(parts) >= 4 and len(parts[-1]) > 5:
                # Не категория
                if m.rstrip('/') + '/' not in [p for p in CATEGORIES.values()]:
                    full = SITE + m
                    if full not in all_links:
                        all_links[full] = cat_name

        # Пагинация
        page = 2
        while True:
            page_url = f'{url}?PAGEN_1={page}'
            page_html = get(page_url)
            if not page_html:
                break
            new = 0
            for m in re.findall(r'href="(/products/[^"]+)"', page_html):
                parts = m.rstrip('/').split('/')
                if len(parts) >= 4 and len(parts[-1]) > 5:
                    full = SITE + m
                    if full not in all_links:
                        all_links[full] = cat_name
                        new += 1
            if new == 0:
                break
            page += 1

        prog.update(1, f'{cat_name[:12]} ({len(all_links)})')
        time.sleep(0.2)

    prog.done(f'{len(all_links)} товаров')
    return all_links


# ═══════════════════════════════════════════
# ФАЗА 2: Парсинг товаров
# ═══════════════════════════════════════════

def parse_product(url):
    html = get(url)
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    p = {'url': url}

    # Название
    h1 = soup.find('h1')
    if not h1:
        return None
    raw = h1.get_text(strip=True)
    # Убираем "Каталог/Видеонаблюдение/..." из начала
    if '/' in raw:
        p['name'] = raw.split('/')[-1].strip()
    else:
        p['name'] = raw

    if not p['name'] or len(p['name']) < 3:
        return None

    p['brand'] = 'FOX'
    p['article'] = url.rstrip('/').split('/')[-1].upper()

    # Характеристики
    p['specs'] = {}
    for table in soup.find_all('table'):
        for tr in table.find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 2:
                k = tds[0].get_text(strip=True)
                v = tds[1].get_text(strip=True)
                if k and v and len(k) < 80:
                    p['specs'][k] = v

    # Также ищем характеристики в dl/dt/dd
    for dl in soup.find_all('dl'):
        dts = dl.find_all('dt')
        dds = dl.find_all('dd')
        for dt, dd in zip(dts, dds):
            k = dt.get_text(strip=True)
            v = dd.get_text(strip=True)
            if k and v:
                p['specs'][k] = v

    # Также ищем div-пары
    for div in soup.find_all('div', class_=re.compile(r'prop|char|param|spec', re.I)):
        text = div.get_text(separator='|', strip=True)
        parts = text.split('|')
        for i in range(0, len(parts) - 1, 2):
            k, v = parts[i].strip(), parts[i + 1].strip()
            if k and v and len(k) < 80:
                p['specs'][k] = v

    # Цена
    p['price'] = ''
    for el in soup.find_all(['span', 'div', 'p']):
        text = el.get_text(strip=True)
        m = re.search(r'([\d\s]+)\s*[₽руб]', text.replace('\xa0', ' '))
        if m:
            val = m.group(1).replace(' ', '')
            if val.isdigit() and len(val) >= 2:
                p['price'] = val
                break

    # Фото — из /upload/ или /images/
    p['images'] = []
    seen = set()
    for img in soup.find_all('img'):
        src = img.get('src', '') or img.get('data-src', '')
        if not src:
            continue
        if '/upload/' in src or '/images/products/' in src:
            full = (SITE + src) if src.startswith('/') else src
            # Убираем мелкие превью — берём оригиналы
            orig = re.sub(r'/resize_cache/[^/]+/\d+_\d+_\d+/', '/', full)
            if orig not in seen and 'logo' not in orig.lower() and 'icon' not in orig.lower():
                p['images'].append(orig)
                seen.add(orig)

    # og:image
    og = soup.find('meta', property='og:image')
    if og and og.get('content'):
        img = og['content']
        full = (SITE + img) if img.startswith('/') else img
        if full not in seen and '/upload/' in full:
            p['images'].insert(0, full)

    # Описание
    p['description'] = ''
    for div in soup.find_all(['div', 'section']):
        cls = ' '.join(div.get('class', []))
        if re.search(r'description|detail|content|text|about', cls, re.I):
            text = div.get_text(separator=' ', strip=True)
            if len(text) > 50 and len(text) < 5000:
                p['description'] = text[:2000]
                break

    if not p['description'] and p['specs']:
        p['description'] = '. '.join(f'{k}: {v}' for k, v in list(p['specs'].items())[:10])

    return p


# ═══════════════════════════════════════════
# ФАЗА 3: Экспорт
# ═══════════════════════════════════════════

def build_xml(p):
    prod = Element('product')
    SubElement(prod, 'name').text = p.get('name', '')
    SubElement(prod, 'article').text = p.get('article', '')
    SubElement(prod, 'brand').text = p.get('brand', '')
    SubElement(prod, 'category').text = p.get('category', '')
    SubElement(prod, 'price').text = str(p.get('price', ''))
    imgs = SubElement(prod, 'images')
    for img in p.get('images', []):
        SubElement(imgs, 'image').text = img
    for img in p.get('local_images', []):
        SubElement(imgs, 'local_image').text = img
    SubElement(prod, 'description').text = p.get('description', '')
    specs = SubElement(prod, 'specs')
    for k, v in p.get('specs', {}).items():
        SubElement(specs, 'spec', name=k).text = v
    SubElement(prod, 'source_url').text = p.get('url', '')
    return prod


def export_all(products):
    print(f'\n📁 ФАЗА 3: Экспорт {len(products)} товаров...')

    OUT = os.path.join(BASE_DIR, 'output')
    os.makedirs(OUT, exist_ok=True)

    tree = {}
    for p in products:
        cat = p.get('category', 'Другое')
        tree.setdefault(cat, []).append(p)

    for cat in sorted(tree.keys()):
        print(f'  📁 {cat}: {len(tree[cat])}')

    # Фото
    print()
    ans = input('Скачать фотографии? (да/нет): ').strip().lower()
    dl = ans in ['да', 'yes', 'y', 'д']

    prog = Progress(len(products), 'Экспорт ')
    all_root = Element('catalog')
    all_root.set('date', datetime.now().strftime('%Y-%m-%d'))
    all_root.set('source', 'fox-cctv.ru')
    all_root.set('total', str(len(products)))

    for cat in sorted(tree.keys()):
        cat_dir = os.path.join(OUT, safe(cat))
        brand_dir = os.path.join(cat_dir, 'FOX')
        os.makedirs(brand_dir, exist_ok=True)

        for p in tree[cat]:
            art = safe(p.get('article', 'noart'))
            prod_dir = os.path.join(brand_dir, art)
            os.makedirs(prod_dir, exist_ok=True)

            p['local_images'] = []
            if dl:
                for idx, img_url in enumerate(p.get('images', [])[:10]):
                    ext = os.path.splitext(img_url.split('?')[0])[1] or '.jpg'
                    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
                        ext = '.jpg'
                    fname = f'photo_{idx + 1}{ext}'
                    fpath = os.path.join(prod_dir, fname)
                    if not os.path.exists(fpath):
                        try:
                            r = requests.get(img_url, headers=H, timeout=10)
                            if r.status_code == 200 and len(r.content) > 500:
                                with open(fpath, 'wb') as f:
                                    f.write(r.content)
                                p['local_images'].append(fname)
                        except:
                            pass
                    else:
                        p['local_images'].append(fname)

            # XML товара
            prod_xml = build_xml(p)
            indent(prod_xml)
            ElementTree(prod_xml).write(
                os.path.join(prod_dir, 'product.xml'),
                encoding='utf-8', xml_declaration=True
            )
            all_root.append(build_xml(p))
            prog.update(1, art[:15])

    prog.done()

    # Общие файлы
    indent(all_root)
    xml_path = os.path.join(OUT, 'products_all.xml')
    ElementTree(all_root).write(xml_path, encoding='utf-8', xml_declaration=True)
    print(f'✅ {xml_path}')

    json_path = os.path.join(OUT, 'products_all.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2, default=str)
    print(f'✅ {json_path}')


# ═══════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════

if __name__ == '__main__':
    print('╔══════════════════════════════════════════════╗')
    print('║  ПАРСЕР fox-cctv.ru → XML                     ║')
    print('║  Фото + Описания + Характеристики              ║')
    print('╚══════════════════════════════════════════════╝')
    print()

    # Фаза 1
    all_links = collect_links()

    # Фаза 2
    print(f'\n📦 ФАЗА 2: Парсинг {len(all_links)} товаров...')
    print()

    prog = Progress(len(all_links), 'Товары  ')
    products = []
    errors = 0

    for url, cat_name in all_links.items():
        product = parse_product(url)
        if product and product.get('name'):
            product['category'] = cat_name
            products.append(product)
            prog.update(1, product.get('article', '')[:15])
        else:
            errors += 1
            prog.update(1, '')
        time.sleep(0.2)

    prog.done(f'{len(products)} собрано, {errors} ошибок')

    # Статистика
    print(f'\n📊 ИТОГО: {len(products)} товаров')
    cc = {}
    for p in products:
        c = p.get('category', '?')
        cc[c] = cc.get(c, 0) + 1
    print('\nПо категориям:')
    for c, n in sorted(cc.items(), key=lambda x: -x[1]):
        print(f'  {c}: {n}')

    with_img = sum(1 for p in products if p.get('images'))
    with_specs = sum(1 for p in products if p.get('specs'))
    print(f'\nС фото: {with_img}/{len(products)}')
    print(f'С характеристиками: {with_specs}/{len(products)}')

    # Фаза 3
    export_all(products)

    print(f'\n{"=" * 50}')
    print(f'ГОТОВО! {len(products)} товаров FOX')
    print(f'{"=" * 50}')
