# -*- coding: utf-8 -*-
"""Утилиты: HTTP, нормализация имён, прогресс-бар"""

import requests
import re
import sys
import time
import shutil
import logging
from pathlib import Path

log = logging.getLogger('tinko')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    'Accept-Language': 'ru-RU,ru;q=0.9',
}

_session = requests.Session()
_session.headers.update(HEADERS)


def get(url: str, retries: int = 3, timeout: int = 30) -> requests.Response | None:
    """GET-запрос с повторами"""
    for attempt in range(retries):
        try:
            r = _session.get(url, timeout=timeout)
            r.raise_for_status()
            return r
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1 + attempt)
                log.debug(f'Retry {attempt + 1} for {url}: {e}')
            else:
                log.warning(f'Failed GET {url}: {e}')
    return None


def download_file(url: str, dest: Path) -> bool:
    """Скачать файл если не существует"""
    if dest.exists() and dest.stat().st_size > 100:
        return True
    try:
        r = _session.get(url, timeout=30)
        if r.status_code == 200 and len(r.content) > 100:
            dest.write_bytes(r.content)
            return True
    except Exception as e:
        log.debug(f'Download failed {url}: {e}')
    return False


def safe_dirname(name: str) -> str:
    """Безопасное имя для папки — нормализация скобок и спецсимволов"""
    s = name
    # Скобки -> квадратные
    s = s.replace('(', '[').replace(')', ']')
    # Двоеточие -> тире (для Spec:I/B/V3.0 -> Spec-I-B-V3.0)
    s = s.replace(':', '-')
    # Слэш -> дефис
    s = s.replace('/', '-')
    s = s.replace('\\', '-')
    # Убираем остальные запрещённые символы Windows
    s = re.sub(r'[<>"|?*]', '', s).strip()
    s = re.sub(r'\s+', ' ', s)
    # Убираем точку в конце (Windows не любит)
    s = s.rstrip('.')
    return s[:200] or 'unknown'


class Progress:
    def __init__(self, total: int, label: str = ''):
        self.total = max(total, 1)
        self.current = 0
        self.label = label
        self.start = time.time()
        self.width = min(40, shutil.get_terminal_size((80, 20)).columns - 50)

    def update(self, extra: str = ''):
        self.current += 1
        pct = self.current / self.total
        filled = int(self.width * pct)
        bar = '\u2588' * filled + '\u2591' * (self.width - filled)
        elapsed = time.time() - self.start
        if self.current > 0 and elapsed > 0:
            eta = (self.total - self.current) / (self.current / elapsed)
            eta_s = f'{int(eta // 60)}m{int(eta % 60):02d}s' if eta >= 60 else f'{int(eta)}s'
        else:
            eta_s = '...'
        info = extra[:20] if extra else ''
        line = f'\r  {self.label} |{bar}| {self.current}/{self.total} ({pct:.0%}) ETA: {eta_s} {info}'
        sys.stdout.write(line.ljust(shutil.get_terminal_size((80, 20)).columns - 1))
        sys.stdout.flush()

    def done(self, msg: str = ''):
        bar = '\u2588' * self.width
        elapsed = time.time() - self.start
        t = f'{int(elapsed // 60)}m{int(elapsed % 60):02d}s' if elapsed >= 60 else f'{elapsed:.0f}s'
        sys.stdout.write(f'\r  {self.label} |{bar}| {self.current}/{self.total} (100%) {t} OK {msg}')
        sys.stdout.write(' ' * 20 + '\n')
        sys.stdout.flush()
