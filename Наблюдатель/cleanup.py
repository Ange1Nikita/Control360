# -*- coding: utf-8 -*-
"""
Очистка output/ — оставляет только:
  - product.xml (и любые .xml)
  - photo_1.* (первое фото)
  - passport_1.pdf (первый паспорт)

Запуск: python cleanup.py
"""
import os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE_DIR, 'output')


def should_keep(filename):
    name_lower = filename.lower()
    if name_lower.endswith('.xml'):
        return True
    if name_lower.startswith('photo_1'):
        return True
    if name_lower.startswith('passport_1'):
        return True
    return False


def main():
    deleted = 0
    kept = 0
    freed = 0

    for root, dirs, files in os.walk(OUT):
        for f in files:
            fpath = os.path.join(root, f)
            if should_keep(f):
                kept += 1
            else:
                size = os.path.getsize(fpath)
                os.remove(fpath)
                deleted += 1
                freed += size

    freed_mb = freed / (1024 * 1024)
    print(f'✅ Готово!')
    print(f'   Удалено: {deleted} файлов ({freed_mb:.1f} МБ)')
    print(f'   Оставлено: {kept} файлов')


if __name__ == '__main__':
    main()
