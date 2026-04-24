# -*- coding: utf-8 -*-
"""
Парсер viguard.pro → папки + XML
Сайт на JS, данные берём из: alt тегов, URL slugs, /upload/ фото

Запуск: python parser_viguard.py
"""
import requests
from bs4 import BeautifulSoup
import os, sys, io, re, json, time, shutil
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://viguard.pro'
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

CATEGORIES = {
    '4G камеры': '/catalog/4g_kamery/',
    '4G Wi-Fi камеры': '/catalog/4g_wi_fi_kamery/',
    'Wi-Fi камеры': '/catalog/wi_fi_kamery/',
    'Готовые комплекты': '/catalog/gotovye_komplekty/',
    'Авто регистраторы': '/catalog/avto_registratory/',
    'Грузовой транспорт': '/catalog/gruzovoy_transport/',
    'Аксессуары': '/catalog/aksessuary/',
    'Экстендеры камер': '/catalog/ekstendery_dlya_kamer/',
    'Экстендеры мониторов': '/catalog/ekstendery_dlya_monitorov/',
    'Аварийные датчики': '/catalog/avariynye_datchiki/',
    'Classic Line': '/catalog/classic_line/',
    'Home Line': '/catalog/home_line/',
    'Автоматика Classic': '/catalog/besprovodnaya_avtomatika_classic_line/',
    'Автоматика Home': '/catalog/avtomatika_home_line/',
    'Брелки Classic': '/catalog/brelki_classic_line/',
    'Брелки Home': '/catalog/brelki_home_line2366/',
    'Доп.оборудование Classic': '/catalog/dop_oborudovanie_classic_line/',
    'Доп.оборудование': '/catalog/dopolnitelnoe_oborudovanie/',
    'Комплекты Classic': '/catalog/komplekty_classic_line/',
    'Комплекты Home': '/catalog/komplekty_home_line/',
    'Fast Box': '/catalog/fast_box/',
    'Combo': '/catalog/combo-4/',
    'IP камеры': '/catalog/ip_kamery/',
    'IP регистраторы': '/catalog/ip_registratory/',
    'TVI камеры': '/catalog/tvi_kamery/',
    'TVI регистраторы': '/catalog/tvi_registratory/',
    'Жёсткие диски': '/catalog/zhestkie_diski/',
    'Коммутаторы': '/catalog/kommutatoryasd/',
    'Мониторы': '/catalog/monitory/',
    'Кабель': '/catalog/kabel/',
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


def slug_to_name(slug):
    """Превращаем URL slug в читаемое название: videokamera-keeper → Videokamera Keeper"""
    name = slug.replace('-', ' ').replace('_', ' ')
    return ' '.join(w.capitalize() for w in name.split())


def collect_all():
    """Собираем товары из листингов категорий — названия из alt, фото из src"""
    print('📋 ФАЗА 1: Сбор товаров из категорий...')
    prog = Progress(len(CATEGORIES), 'Категории')
    products = {}  # url -> product dict

    for cat_name, cat_path in CATEGORIES.items():
        html = get(SITE + cat_path)
        if not html:
            prog.update(1, cat_name[:15])
            continue

        soup = BeautifulSoup(html, 'html.parser')

        # Ищем товары по img с alt (основной источник данных)
        for img in soup.find_all('img'):
            alt = img.get('alt', '').strip()
            src = img.get('src', '') or img.get('data-src', '')

            if not alt or len(alt) < 5 or 'logo' in alt.lower() or 'VIGUARD.PRO' in alt:
                continue
            if not src or '/upload/' not in src:
                continue

            # Ищем ссылку-родитель
            parent_a = img.find_parent('a', href=True)
            url = ''
            if parent_a:
                href = parent_a['href']
                if '/catalog/' in href:
                    url = (SITE + href) if href.startswith('/') else href

            if not url:
                continue

            full_img = (SITE + src) if src.startswith('/') else src
            slug = url.rstrip('/').split('/')[-1]
            article = slug.upper().replace('-', ' ')

            if url not in products:
                products[url] = {
                    'url': url,
                    'name': alt,
                    'article': article,
                    'brand': 'ViGUARD',
                    'category': cat_name,
                    'images': [full_img],
                    'specs': {},
                    'description': alt,
                    'price': '',
                }
            else:
                # Добавляем фото если новое
                if full_img not in products[url]['images']:
                    products[url]['images'].append(full_img)

        # Также собираем ссылки на товары напрямую
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/catalog/' in href and href != cat_path:
                full = (SITE + href) if href.startswith('/') else href
                slug = href.rstrip('/').split('/')[-1]
                if len(slug) > 5 and slug not in [p.rstrip('/').split('/')[-1] for p in CATEGORIES.values()]:
                    if full not in products:
                        products[full] = {
                            'url': full,
                            'name': slug_to_name(slug),
                            'article': slug.upper(),
                            'brand': 'ViGUARD',
                            'category': cat_name,
                            'images': [],
                            'specs': {},
                            'description': '',
                            'price': '',
                        }

        # Пагинация
        page = 2
        while True:
            ph = get(SITE + cat_path + f'?PAGEN_1={page}')
            if not ph:
                break
            soup2 = BeautifulSoup(ph, 'html.parser')
            new = 0
            for img in soup2.find_all('img'):
                alt = img.get('alt', '').strip()
                src = img.get('src', '') or img.get('data-src', '')
                if not alt or len(alt) < 5 or 'logo' in alt.lower():
                    continue
                parent_a = img.find_parent('a', href=True)
                if parent_a and '/catalog/' in parent_a['href']:
                    url = SITE + parent_a['href']
                    if url not in products:
                        full_img = (SITE + src) if src.startswith('/') else src
                        products[url] = {
                            'url': url, 'name': alt,
                            'article': url.rstrip('/').split('/')[-1].upper(),
                            'brand': 'ViGUARD', 'category': cat_name,
                            'images': [full_img] if '/upload/' in src else [],
                            'specs': {}, 'description': alt, 'price': '',
                        }
                        new += 1
            if not new:
                break
            page += 1

        prog.update(1, f'{cat_name[:12]} ({len(products)})')
        time.sleep(0.2)

    prog.done(f'{len(products)} товаров')

    # Дополняем из sitemap
    print('  Дополняю из sitemap...')
    sm_html = get(SITE + '/sitemap_iblock_12.xml')
    if sm_html:
        sm_urls = re.findall(r'<loc>(.*?/catalog/detail/[^<]+)</loc>', sm_html)
        for u in sm_urls:
            if u not in products:
                slug = u.rstrip('/').split('/')[-1]
                products[u] = {
                    'url': u, 'name': slug_to_name(slug),
                    'article': slug.upper(), 'brand': 'ViGUARD',
                    'category': 'Другое', 'images': [],
                    'specs': {}, 'description': '', 'price': '',
                }
        print(f'  После sitemap: {len(products)} товаров')

    # Парсим страницы товаров для получения доп. фото
    print(f'\n📦 ФАЗА 2: Дополняем фото и описания...\n')
    items = list(products.values())
    prog2 = Progress(len(items), 'Товары  ')

    for p in items:
        html = get(p['url'])
        if html:
            soup = BeautifulSoup(html, 'html.parser')
            # Фото из страницы товара
            for img in soup.find_all('img'):
                src = img.get('src', '') or img.get('data-src', '')
                if src and '/upload/' in src and 'logo' not in src.lower():
                    full = (SITE + src) if src.startswith('/') else src
                    if full not in p['images']:
                        p['images'].append(full)

            # Характеристики
            for table in soup.find_all('table'):
                for tr in table.find_all('tr'):
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) >= 2:
                        k = tds[0].get_text(strip=True)
                        v = tds[1].get_text(strip=True)
                        if k and v and len(k) < 80:
                            p['specs'][k] = v

        prog2.update(1, p.get('article', '')[:15])
        time.sleep(0.2)

    prog2.done()
    return list(products.values())


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
    all_root.set('source', 'viguard.pro')
    all_root.set('total', str(len(products)))

    for cat in sorted(tree.keys()):
        brand_dir = os.path.join(OUT, safe(cat), 'ViGUARD')
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
    print('║  ПАРСЕР viguard.pro → XML                     ║')
    print('║  Фото + Описания + Характеристики              ║')
    print('╚══════════════════════════════════════════════╝')
    print()

    products = collect_all()

    print(f'\n📊 ИТОГО: {len(products)} товаров ViGUARD')
    cc = {}
    for p in products:
        cc[p.get('category', '?')] = cc.get(p.get('category', '?'), 0) + 1
    for c, n in sorted(cc.items(), key=lambda x: -x[1]):
        print(f'  {c}: {n}')

    with_img = sum(1 for p in products if p.get('images'))
    print(f'\nС фото: {with_img}/{len(products)}')

    export_all(products)
    print(f'\n{"="*50}\nГОТОВО! {len(products)} товаров ViGUARD\n{"="*50}')
