# -*- coding: utf-8 -*-
"""
Парсер keno-cctv.ru → папки + XML
Быстрый сайт (~0.9с), ~100 товаров, ~2 минуты

Запуск: python parser_keno.py
"""
import requests
from bs4 import BeautifulSoup
import os, sys, io, re, json, time, shutil
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://keno-cctv.ru'
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

CATEGORIES = {
    'IP камеры': '/products/ip-kamery/',
    'IP камеры цилиндрические': '/products/ip-kamery-cilindricheskie/',
    'IP камеры купольные': '/products/ip-kamery-kupolnye/',
    'IP камеры поворотные': '/products/ip-kamery-skorostnye-povorotnye/',
    'IP регистраторы': '/products/ip-dvr/',
    'TVI камеры': '/products/tvi-kamery/',
    'TVI регистраторы': '/products/tvi-videoregistratory/',
    'Домофоны': '/products/domofony/',
    'Вызывные панели': '/products/vyzyvnye-paneli/',
    'Коммутаторы': '/products/commutators/',
    'Узлы коммутации': '/products/uzly-kommutatsii/',
    'Проектные решения тип 1': '/products/proektnye-resheniya-type-1/',
    'Проектные решения тип 2': '/products/proektnye-resheniya-type-2/',
    'Проектные решения тип 3': '/products/proektnye-resheniya-type-3/',
    'Проектные решения тип 4': '/products/proektnye-resheniya-type-4/',
    'Все товары': '/products/all/',
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
            eta = (self.total - self.current) / (self.current / el)
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


def collect_links():
    print('📋 ФАЗА 1: Сбор ссылок...')
    prog = Progress(len(CATEGORIES), 'Категории')
    all_links = {}
    cat_paths = set(CATEGORIES.values())

    for cat_name, cat_path in CATEGORIES.items():
        html = get(SITE + cat_path)
        if not html:
            prog.update(1, cat_name[:15])
            continue

        for m in re.findall(r'href="(/products/[^"]+/[^"]+/)"', html):
            if m not in cat_paths and len(m.rstrip('/').split('/')[-1]) > 3:
                full = SITE + m
                if full not in all_links:
                    all_links[full] = cat_name

        # Пагинация
        page = 2
        while True:
            ph = get(SITE + cat_path + f'?PAGEN_1={page}')
            if not ph:
                break
            new = 0
            for m in re.findall(r'href="(/products/[^"]+/[^"]+/)"', ph):
                if m not in cat_paths and len(m.rstrip('/').split('/')[-1]) > 3:
                    full = SITE + m
                    if full not in all_links:
                        all_links[full] = cat_name
                        new += 1
            if not new:
                break
            page += 1

        prog.update(1, f'{cat_name[:12]} ({len(all_links)})')
        time.sleep(0.2)

    prog.done(f'{len(all_links)} товаров')
    return all_links


def parse_product(url):
    html = get(url)
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    p = {'url': url}

    h1 = soup.find('h1')
    if not h1:
        return None
    p['name'] = h1.get_text(strip=True)
    if not p['name'] or len(p['name']) < 3:
        return None

    p['brand'] = 'KENO'
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

    for dl in soup.find_all('dl'):
        for dt, dd in zip(dl.find_all('dt'), dl.find_all('dd')):
            k, v = dt.get_text(strip=True), dd.get_text(strip=True)
            if k and v:
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

    # Фото
    p['images'] = []
    seen = set()

    og = soup.find('meta', property='og:image')
    if og and og.get('content'):
        img = og['content']
        full = (SITE + img) if img.startswith('/') else img
        p['images'].append(full)
        seen.add(full)

    for img in soup.find_all('img'):
        src = img.get('src', '') or img.get('data-src', '')
        if not src:
            continue
        full = (SITE + src) if src.startswith('/') else src
        if full in seen:
            continue
        if '/upload/' in src or '/images/' in src or '/products/' in src:
            if 'logo' not in src.lower() and 'icon' not in src.lower() and 'banner' not in src.lower():
                p['images'].append(full)
                seen.add(full)

    # Описание
    p['description'] = ''
    for div in soup.find_all(['div', 'section']):
        cls = ' '.join(div.get('class', []))
        if re.search(r'description|detail|content|text|about|tab', cls, re.I):
            text = div.get_text(separator=' ', strip=True)
            if 50 < len(text) < 5000:
                p['description'] = text[:2000]
                break

    if not p['description'] and p['specs']:
        p['description'] = '. '.join(f'{k}: {v}' for k, v in list(p['specs'].items())[:10])

    return p


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
        tree.setdefault(p.get('category', 'Другое'), []).append(p)

    for cat in sorted(tree.keys()):
        print(f'  📁 {cat}: {len(tree[cat])}')

    print()
    dl = input('Скачать фото? (да/нет): ').strip().lower() in ['да', 'y', 'д']

    prog = Progress(len(products), 'Экспорт ')
    all_root = Element('catalog')
    all_root.set('date', datetime.now().strftime('%Y-%m-%d'))
    all_root.set('source', 'keno-cctv.ru')
    all_root.set('total', str(len(products)))

    for cat in sorted(tree.keys()):
        cat_dir = os.path.join(OUT, safe(cat))
        brand_dir = os.path.join(cat_dir, 'KENO')
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

            prod_xml = build_xml(p)
            indent(prod_xml)
            ElementTree(prod_xml).write(os.path.join(prod_dir, 'product.xml'), encoding='utf-8', xml_declaration=True)
            all_root.append(build_xml(p))
            prog.update(1, art[:15])

    prog.done()

    indent(all_root)
    ElementTree(all_root).write(os.path.join(OUT, 'products_all.xml'), encoding='utf-8', xml_declaration=True)
    print(f'✅ products_all.xml')

    with open(os.path.join(OUT, 'products_all.json'), 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2, default=str)
    print(f'✅ products_all.json')


if __name__ == '__main__':
    print('╔══════════════════════════════════════════════╗')
    print('║  ПАРСЕР keno-cctv.ru → XML                    ║')
    print('║  Фото + Описания + Характеристики              ║')
    print('╚══════════════════════════════════════════════╝')
    print()

    all_links = collect_links()

    print(f'\n📦 ФАЗА 2: Парсинг {len(all_links)} товаров...\n')
    prog = Progress(len(all_links), 'Товары  ')
    products = []
    errors = 0

    for url, cat in all_links.items():
        p = parse_product(url)
        if p and p.get('name'):
            p['category'] = cat
            products.append(p)
            prog.update(1, p.get('article', '')[:15])
        else:
            errors += 1
            prog.update(1, '')
        time.sleep(0.2)

    prog.done(f'{len(products)} собрано, {errors} ошибок')

    print(f'\n📊 ИТОГО: {len(products)} товаров KENO')
    cc = {}
    for p in products:
        cc[p.get('category', '?')] = cc.get(p.get('category', '?'), 0) + 1
    for c, n in sorted(cc.items(), key=lambda x: -x[1]):
        print(f'  {c}: {n}')

    export_all(products)
    print(f'\n{"="*50}\nГОТОВО! {len(products)} товаров KENO\n{"="*50}')
