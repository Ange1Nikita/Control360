# -*- coding: utf-8 -*-
"""
Парсер HiWatch с tinko.ru
Запуск: python main.py
Без скачивания файлов: python main.py --no-download
"""

import sys
import io
import os
import logging
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# Добавляем корень проекта в path для импорта tinko_core
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# Логирование
LOG_DIR = Path(__file__).parent / 'output'
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'parser.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger('tinko')
logging.getLogger('urllib3').setLevel(logging.WARNING)

from tinko_core.parser import parse_all
from tinko_core.downloader import download_all
from tinko_core.xml_builder import save_product_xml, save_all_products_xml, save_all_products_csv
from tinko_core.utils import safe_dirname

BRAND = 'HiWatch'
QUERY = 'hiwatch'


def main():
    OUTPUT = Path(__file__).parent / 'output'
    OUTPUT.mkdir(exist_ok=True)

    print('=' * 52)
    print(f'  ПАРСЕР {BRAND.upper()} (tinko.ru)')
    print('  Фото + Описание + Характеристики + Документы')
    print('=' * 52)

    # Фаза 1-2: парсинг
    products = parse_all(query=QUERY, brand_name=BRAND, brand_filter=BRAND)

    if not products:
        print('\n[X] Товары не найдены')
        return

    print(f'\n{"=" * 50}')
    print(f'[=] ИТОГО: {len(products)} товаров {BRAND}')
    print(f'{"=" * 50}')

    # Фаза 3: скачивание файлов
    dl = '--no-download' not in sys.argv
    if dl:
        total_files = sum(len(p.get('images', [])) + len(p.get('passports', [])) for p in products)
        print(f'\n[v] Скачивание {total_files} файлов (фото + документы)...')
        print(f'    (запустите с --no-download чтобы пропустить)')
        print()
        download_all(products, OUTPUT, workers=10)
    else:
        print(f'\n[skip] Скачивание пропущено (--no-download)')
        for p in products:
            p['local_images'] = []
            p['local_passports'] = []

    # Фаза 4: экспорт XML
    print(f'\n[+] Экспорт XML и CSV...')

    for p in products:
        cat = safe_dirname(p.get('category', 'Без категории'))
        model = safe_dirname(p.get('model', p.get('name', 'unknown')))

        prod_dir = OUTPUT / safe_dirname(cat) / model
        prod_dir.mkdir(parents=True, exist_ok=True)
        save_product_xml(p, prod_dir / 'product.xml')

    save_all_products_xml(products, OUTPUT / 'all_products.xml', brand=BRAND)
    save_all_products_csv(products, OUTPUT / 'all_products.csv')

    print(f'OK all_products.xml: {OUTPUT / "all_products.xml"}')
    print(f'OK all_products.csv: {OUTPUT / "all_products.csv"}')

    # Структура
    cats = {}
    for p in products:
        c = p.get('category', '?')
        cats.setdefault(c, []).append(p)

    print(f'\n[>] Структура output/:')
    for cat_name in sorted(cats.keys()):
        prods = cats[cat_name]
        print(f'  [+] {cat_name}/ ({len(prods)} товаров)')
        for p in prods[:3]:
            m = p.get('name', '?')
            imgs = len(p.get('images', []))
            docs = len(p.get('passports', []))
            print(f'       {m}/ (product.xml + {imgs} фото + {docs} док.)')
        if len(prods) > 3:
            print(f'      ... и ещё {len(prods) - 3}')

    print(f'\n{"=" * 50}')
    print(f'ГОТОВО!')
    print(f'{"=" * 50}')


if __name__ == '__main__':
    main()
