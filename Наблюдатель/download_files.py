# -*- coding: utf-8 -*-
"""
Скачивание фото и паспортов из уже спарсенного products_all.json
Не перепарсивает сайт — только скачивает файлы.

Запуск: python download_files.py
"""
import requests
import os, sys, io, re, json, time
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, 'output')
JSON_PATH = os.path.join(OUT, 'products_all.json')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0'}
session = requests.Session()
session.headers.update(HEADERS)


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

    def done(self, msg=''):
        bar = '█' * self.width
        elapsed = time.time() - self.start_time
        elapsed_str = f'{int(elapsed // 60)}м{int(elapsed % 60):02d}с' if elapsed >= 60 else f'{elapsed:.0f}с'
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} (100%) за {elapsed_str} ✅ {msg}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        print()


def make_safe_dirname(name):
    safe = re.sub(r'[<>:"/\\|?*]', '', name).strip()
    return safe[:200] or 'Без названия'


def download_file(url, dest_path):
    if os.path.exists(dest_path):
        return True
    try:
        r = session.get(url, timeout=15)
        if r.status_code == 200 and len(r.content) > 100:
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            return True
    except Exception:
        pass
    return False


def main():
    print('📥 Скачивание фото и паспортов из products_all.json')
    print()

    if not os.path.exists(JSON_PATH):
        print(f'❌ Файл не найден: {JSON_PATH}')
        print('   Сначала запустите parser.py')
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f'  Товаров: {len(products)}')

    total_images = sum(len(p.get('images', [])) for p in products)
    total_passports = sum(len(p.get('passports', [])) for p in products)
    total_files = total_images + total_passports

    # Посчитаем сколько уже скачано
    already = 0
    for p in products:
        cat = p.get('category', 'Без категории')
        brand = p.get('brand', 'Другое')
        art = p.get('article', p.get('id', 'noart'))
        prod_dir = os.path.join(OUT, make_safe_dirname(cat), make_safe_dirname(brand), make_safe_dirname(art))
        for idx in range(len(p.get('images', []))):
            img_url = p['images'][idx]
            ext = os.path.splitext(img_url.split('?')[0])[1] or '.jpg'
            if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                ext = '.jpg'
            fpath = os.path.join(prod_dir, f'photo_{idx + 1}{ext}')
            if os.path.exists(fpath):
                already += 1
        for idx in range(len(p.get('passports', []))):
            fpath = os.path.join(prod_dir, f'passport_{idx + 1}.pdf')
            if os.path.exists(fpath):
                already += 1

    to_download = total_files - already
    print(f'  Фото: {total_images}')
    print(f'  Паспортов: {total_passports}')
    print(f'  Всего файлов: {total_files}')
    print(f'  Уже скачано: {already}')
    print(f'  Осталось: {to_download}')
    print()

    if to_download == 0:
        print('✅ Все файлы уже скачаны!')
        return

    # Собираем список задач на скачивание
    tasks = []  # (url, dest_path, label)
    for p in products:
        cat = p.get('category', 'Без категории')
        brand = p.get('brand', 'Другое')
        art = p.get('article', p.get('id', 'noart'))
        prod_dir = os.path.join(OUT, make_safe_dirname(cat), make_safe_dirname(brand), make_safe_dirname(art))
        os.makedirs(prod_dir, exist_ok=True)

        for idx, img_url in enumerate(p.get('images', [])):
            ext = os.path.splitext(img_url.split('?')[0])[1] or '.jpg'
            if ext.lower() not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                ext = '.jpg'
            fpath = os.path.join(prod_dir, f'photo_{idx + 1}{ext}')
            tasks.append((img_url, fpath, art[:15]))

        for idx, pdf_url in enumerate(p.get('passports', [])):
            fpath = os.path.join(prod_dir, f'passport_{idx + 1}.pdf')
            tasks.append((pdf_url, fpath, art[:15]))

    progress = Progress(len(tasks), 'Скачивание')
    downloaded = 0
    skipped = 0
    errors = 0
    lock = threading.Lock()

    WORKERS = 20  # 20 потоков параллельно

    def do_download(task):
        url, dest, label = task
        if os.path.exists(dest):
            return 'skip', label
        if download_file(url, dest):
            return 'ok', label
        return 'err', label

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(do_download, t): t for t in tasks}
        for future in as_completed(futures):
            result, label = future.result()
            with lock:
                if result == 'skip':
                    skipped += 1
                elif result == 'ok':
                    downloaded += 1
                else:
                    errors += 1
                progress.update(1, label)

    progress.done(f'{downloaded} скачано, {skipped} было, {errors} ошибок')
    print(f'\n✅ Готово!')


if __name__ == '__main__':
    main()
