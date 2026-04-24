# -*- coding: utf-8 -*-
"""Скачивание файлов: фото и документы"""

import re
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

from tinko_core.utils import download_file, safe_dirname, Progress

log = logging.getLogger('tinko')

# Соответствие ключевых слов в заголовке -> имя файла
DOC_NAMES = {
    'паспорт': 'passport',
    'каталог': 'catalog',
    'инструкция': 'instruction',
    'руководство': 'manual',
    'сертификат': 'certificate',
    'декларация': 'declaration',
    'спецификация': 'specification',
    'datasheet': 'datasheet',
}


def _doc_filename(title: str, idx: int, used: set) -> str:
    """Определить имя файла для документа по его заголовку"""
    title_low = title.lower()
    for keyword, name in DOC_NAMES.items():
        if keyword in title_low:
            fname = f'{name}.pdf'
            if fname in used:
                fname = f'{name}_{idx + 1}.pdf'
            used.add(fname)
            return fname

    fname = 'document.pdf' if not used else f'document_{idx + 1}.pdf'
    used.add(fname)
    return fname


def download_product_files(product: dict, prod_dir: Path) -> dict:
    """Скачать фото и документы одного товара"""
    prod_dir.mkdir(parents=True, exist_ok=True)

    # Фото
    local_images = []
    for idx, img_url in enumerate(product.get('images', [])):
        ext = _get_ext(img_url, '.jpg')
        fname = 'image.jpg' if idx == 0 else f'image_{idx + 1}{ext}'
        fpath = prod_dir / fname
        if download_file(img_url, fpath):
            local_images.append(fname)
    product['local_images'] = local_images

    # Документы
    local_passports = []
    used_names = set()
    for idx, doc in enumerate(product.get('passports', [])):
        doc_url = doc['url'] if isinstance(doc, dict) else doc
        title = doc.get('title', '') if isinstance(doc, dict) else ''
        fname = _doc_filename(title, idx, used_names)
        fpath = prod_dir / fname
        if download_file(doc_url, fpath):
            local_passports.append(fname)
    product['local_passports'] = local_passports

    return product


def download_all(products: list[dict], output_dir: Path, workers: int = 10):
    """Скачать все файлы для всех товаров"""
    total_files = sum(
        len(p.get('images', [])) + len(p.get('passports', []))
        for p in products
    )
    log.info(f'Скачивание файлов: {total_files} (фото + документы), потоков: {workers}')

    progress = Progress(len(products), 'Файлы   ')
    lock = threading.Lock()

    def process(p):
        cat = safe_dirname(p.get('category', 'Без категории'))
        model = safe_dirname(p.get('model', p.get('name', 'unknown')))

        prod_dir = output_dir / safe_dirname(cat) / model
        download_product_files(p, prod_dir)
        return p

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process, p): p for p in products}
        for future in as_completed(futures):
            p = future.result()
            with lock:
                progress.update(p.get('name', '')[:18])

    progress.done(f'{len(products)} товаров')


def _get_ext(url: str, default: str = '.jpg') -> str:
    m = re.search(r'\.(jpg|jpeg|png|webp|gif)', url.lower())
    return f'.{m.group(1)}' if m else default
