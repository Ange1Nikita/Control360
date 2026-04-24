# -*- coding: utf-8 -*-
"""Генерация PDF-инструкции по парсерам и системе импорта"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

from fpdf import FPDF
from datetime import datetime

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        # Подключаем шрифт с поддержкой кириллицы
        self.add_font('DejaVu', '', 'C:/Windows/Fonts/arial.ttf')
        self.add_font('DejaVu', 'B', 'C:/Windows/Fonts/arialbd.ttf')
        self.add_font('DejaVu', 'I', 'C:/Windows/Fonts/ariali.ttf')
        self.add_font('Mono', '', 'C:/Windows/Fonts/consola.ttf')

    def header(self):
        self.set_font('DejaVu', 'B', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, 'VidosGroup - Инструкция по парсерам и импорту', align='L')
        self.ln(4)
        self.set_draw_color(55, 126, 250)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font('DejaVu', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Страница {self.page_no()}/{{nb}}', align='C')

    def chapter_title(self, title):
        self.set_font('DejaVu', 'B', 16)
        self.set_text_color(15, 23, 42)
        self.ln(4)
        self.cell(0, 10, title)
        self.ln(8)

    def section_title(self, title):
        self.set_font('DejaVu', 'B', 13)
        self.set_text_color(55, 126, 250)
        self.ln(2)
        self.cell(0, 8, title)
        self.ln(7)

    def subsection(self, title):
        self.set_font('DejaVu', 'B', 11)
        self.set_text_color(30, 30, 30)
        self.cell(0, 7, title)
        self.ln(6)

    def body(self, text):
        self.set_font('DejaVu', '', 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def code(self, text):
        self.set_font('Mono', '', 9)
        self.set_fill_color(245, 245, 250)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.set_x(x + 4)
        for line in text.strip().split('\n'):
            self.cell(180, 5.5, '  ' + line, fill=True)
            self.ln(5.5)
        self.set_font('DejaVu', '', 10)
        self.ln(3)

    def bullet(self, text):
        self.set_font('DejaVu', '', 10)
        self.set_text_color(50, 50, 50)
        x = self.get_x()
        self.set_x(x + 6)
        self.cell(4, 5.5, chr(8226))
        self.multi_cell(170, 5.5, text)
        self.ln(1)

    def table_row(self, col1, col2, header=False):
        if header:
            self.set_font('DejaVu', 'B', 9)
            self.set_fill_color(240, 244, 255)
        else:
            self.set_font('DejaVu', '', 9)
            self.set_fill_color(255, 255, 255)
        self.set_text_color(30, 30, 30)
        self.cell(60, 7, col1, border=1, fill=True)
        self.cell(130, 7, col2, border=1, fill=True)
        self.ln()


def generate():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ===== ТИТУЛЬНАЯ СТРАНИЦА =====
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('DejaVu', 'B', 28)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 15, 'Система парсеров', align='C')
    pdf.ln(12)
    pdf.cell(0, 15, 'и импорта товаров', align='C')
    pdf.ln(20)
    pdf.set_font('DejaVu', '', 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, 'Полная инструкция по настройке, запуску и использованию', align='C')
    pdf.ln(8)
    pdf.cell(0, 10, 'парсеров для сбора каталогов с сайтов поставщиков', align='C')
    pdf.ln(30)
    pdf.set_font('DejaVu', 'B', 12)
    pdf.set_text_color(55, 126, 250)
    pdf.cell(0, 10, 'VidosGroup', align='C')
    pdf.ln(8)
    pdf.set_font('DejaVu', '', 11)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 10, f'Дата: {datetime.now().strftime("%d.%m.%Y")}', align='C')

    # ===== СОДЕРЖАНИЕ =====
    pdf.add_page()
    pdf.chapter_title('Содержание')
    toc = [
        '1. Общая архитектура',
        '2. Структура проекта',
        '3. Парсер "Наблюдатель" (n-23.ru)',
        '4. Парсер HiWatch (hiwatch.net)',
        '5. Утилиты: очистка и переименование',
        '6. Система импорта в админ-панели',
        '7. Добавление нового бренда',
        '8. Устранение проблем',
    ]
    for item in toc:
        pdf.body(item)

    # ===== 1. ОБЩАЯ АРХИТЕКТУРА =====
    pdf.add_page()
    pdf.chapter_title('1. Общая архитектура')

    pdf.body(
        'Система состоит из двух частей:\n\n'
        '1) Парсеры - Python-скрипты, которые собирают данные с сайтов поставщиков '
        '(названия, фото, характеристики, описания, паспорта PDF) и сохраняют их '
        'в структурированные папки с XML-файлами.\n\n'
        '2) Система импорта - встроена в админ-панель сайта (Next.js). Читает XML-файлы '
        'из папок парсеров и загружает товары в базу данных сайта с копированием фото и документов.'
    )

    pdf.section_title('Схема работы')
    pdf.body(
        'Сайт поставщика  -->  Парсер (Python)  -->  output/ (XML + фото + PDF)\n'
        '                                                    |\n'
        '                                                    v\n'
        '                                        Админ-панель --> Импорт --> База данных сайта'
    )

    pdf.section_title('Что собирает каждый парсер')
    pdf.bullet('Название товара и модель')
    pdf.bullet('Категория / подкатегория')
    pdf.bullet('Описание товара')
    pdf.bullet('Технические характеристики')
    pdf.bullet('Фотографии (главное фото + дополнительные)')
    pdf.bullet('Паспорта, сертификаты, инструкции (PDF)')
    pdf.bullet('Ссылка на оригинальную страницу товара')

    # ===== 2. СТРУКТУРА ПРОЕКТА =====
    pdf.add_page()
    pdf.chapter_title('2. Структура проекта')

    pdf.code(
        'C:\\Курсор\\Наш сайт\\Сайт\\\n'
        '|\n'
        '+-- app/                    # Сайт (Next.js)\n'
        '|   +-- src/\n'
        '|   +-- prisma/\n'
        '|   +-- public/products/    # Фото и PDF товаров\n'
        '|\n'
        '+-- Наблюдатель/            # Парсер n-23.ru\n'
        '|   +-- parser.py\n'
        '|   +-- download_files.py\n'
        '|   +-- cleanup.py\n'
        '|   +-- output/             # Результат парсинга\n'
        '|\n'
        '+-- HiWatch/                # Парсер hiwatch.net\n'
        '|   +-- main.py\n'
        '|   +-- parser.py\n'
        '|   +-- downloader.py\n'
        '|   +-- xml_builder.py\n'
        '|   +-- utils.py\n'
        '|   +-- rename_docs.py\n'
        '|   +-- output/             # Результат парсинга\n'
        '|\n'
        '+-- FOX/                    # Папка бренда FOX\n'
        '+-- KENO/                   # Папка бренда KENO\n'
        '+-- Viguard/                # Папка бренда Viguard'
    )

    pdf.section_title('Структура output/ (результат парсера)')
    pdf.code(
        'output/\n'
        '+-- all_products.xml        # Все товары в одном XML\n'
        '+-- all_products.csv        # Все товары в CSV\n'
        '+-- Категория 1/\n'
        '|   +-- Модель-1/\n'
        '|   |   +-- product.xml     # Данные товара\n'
        '|   |   +-- image.jpg       # Главное фото\n'
        '|   |   +-- паспорт.pdf     # Паспорт\n'
        '|   |   +-- сертификат.pdf  # Сертификат\n'
        '|   |   +-- инструкция.pdf  # Инструкция\n'
        '|   +-- Модель-2/\n'
        '|       +-- ...\n'
        '+-- Категория 2/\n'
        '    +-- ...'
    )

    # ===== 3. ПАРСЕР НАБЛЮДАТЕЛЬ =====
    pdf.add_page()
    pdf.chapter_title('3. Парсер "Наблюдатель" (n-23.ru)')

    pdf.section_title('Описание')
    pdf.body(
        'Парсит полный каталог магазина "Наблюдатель" (n-23.ru). '
        'Собирает 1555+ товаров из 21 категории. Бренд: Наблюдатель.\n\n'
        'Сайт работает на кастомной CMS. Товары рендерятся в статическом HTML. '
        'Ссылки на товары с полными URL (https://n-23.ru/...). '
        'Паспорта доступны напрямую по ссылкам.'
    )

    pdf.section_title('Файлы проекта')
    pdf.table_row('Файл', 'Назначение', header=True)
    pdf.table_row('parser.py', 'Основной парсер - сбор данных и экспорт')
    pdf.table_row('download_files.py', 'Скачивание фото и PDF (многопоточно, 20 потоков)')
    pdf.table_row('cleanup.py', 'Удаление лишних файлов (оставляет 1 фото + 1 PDF + XML)')

    pdf.section_title('Запуск')

    pdf.subsection('Шаг 1: Парсинг (сбор данных)')
    pdf.code(
        'cd C:\\Курсор\\Наш сайт\\Сайт\\Наблюдатель\n'
        'python parser.py'
    )
    pdf.body(
        'Время: ~25 минут. Собирает все товары, характеристики, описания. '
        'Сохраняет XML и JSON. Фото и PDF по умолчанию тоже скачиваются '
        '(запустите с --no-download чтобы пропустить).'
    )

    pdf.subsection('Шаг 2: Скачивание файлов (если пропущено)')
    pdf.code(
        'python download_files.py'
    )
    pdf.body('Скачивает фото и паспорта в 20 потоков. Пропускает уже скачанные. Время: ~20 минут.')

    pdf.subsection('Шаг 3: Очистка (опционально)')
    pdf.code(
        'python cleanup.py'
    )
    pdf.body('Оставляет в каждой папке только photo_1.*, passport_1.pdf и .xml файлы. Удаляет лишнее.')

    pdf.section_title('Результат')
    pdf.bullet('1555 товаров, 21 категория, 80+ брендов')
    pdf.bullet('100% покрытие фото и описаний')
    pdf.bullet('76% с паспортами PDF')
    pdf.bullet('XML + JSON + папочная структура по категориям и брендам')

    pdf.section_title('Фазы работы парсера')
    pdf.bullet('Фаза 1: Автообнаружение категорий из меню сайта')
    pdf.bullet('Фаза 2: Сбор ссылок на товары (пагинация + 1 уровень подкатегорий)')
    pdf.bullet('Фаза 3: Парсинг каждого товара (schema.org, lightgallery, AJAX для PDF)')
    pdf.bullet('Экспорт: XML/JSON + папки по категориям/брендам + скачивание файлов')

    # ===== 4. ПАРСЕР HIWATCH =====
    pdf.add_page()
    pdf.chapter_title('4. Парсер HiWatch (hiwatch.net)')

    pdf.section_title('Описание')
    pdf.body(
        'Парсит каталог HiWatch (hiwatch.net). Собирает 516 товаров из 5 основных разделов. '
        'Бренд: HiWatch.\n\n'
        'Сайт на OpenCart. Статический HTML. Паспорта загружаются через AJAX POST запрос '
        'к тому же URL товара с параметром cr_documentation_action.'
    )

    pdf.section_title('Файлы проекта')
    pdf.table_row('Файл', 'Назначение', header=True)
    pdf.table_row('main.py', 'Главный файл запуска')
    pdf.table_row('parser.py', 'Логика парсинга (категории, товары, характеристики)')
    pdf.table_row('downloader.py', 'Многопоточное скачивание фото и PDF (10 потоков)')
    pdf.table_row('xml_builder.py', 'Генерация XML и CSV файлов')
    pdf.table_row('utils.py', 'HTTP-запросы, прогресс-бар, утилиты')
    pdf.table_row('rename_docs.py', 'Переименование PDF по реальным названиям с сайта')
    pdf.table_row('requirements.txt', 'Зависимости Python')

    pdf.section_title('Установка зависимостей')
    pdf.code(
        'cd C:\\Курсор\\Наш сайт\\Сайт\\HiWatch\n'
        'pip install -r requirements.txt'
    )

    pdf.section_title('Запуск')

    pdf.subsection('Полный парсинг + скачивание')
    pdf.code('python main.py')
    pdf.body('Парсит все товары в 15 потоков, скачивает фото и PDF в 10 потоков. Время: ~10 минут.')

    pdf.subsection('Только парсинг без скачивания')
    pdf.code('python main.py --no-download')
    pdf.body('Только XML/CSV. Время: ~3 минуты.')

    pdf.subsection('Переименование PDF')
    pdf.code('python rename_docs.py')
    pdf.body(
        'Проходит по всем папкам, запрашивает реальные названия документов с сайта '
        'и переименовывает: passport.pdf -> паспорт.pdf, passport_2.pdf -> сертификат.pdf и т.д.'
    )

    pdf.section_title('Особенности парсинга')
    pdf.bullet('Модель товара берётся из последнего breadcrumb (не из itemprop="model")')
    pdf.bullet('Характеристики - из описания mini_desc (разделитель ";")')
    pdf.bullet('PDF скачиваются через AJAX POST (cr_documentation_action=download)')
    pdf.bullet('Главное фото из lightgallery (href), дополнительные из image-additional')

    pdf.section_title('Результат')
    pdf.bullet('516 товаров, 13 категорий')
    pdf.bullet('100% с фото и описаниями')
    pdf.bullet('93% с паспортами (482 из 516)')

    # ===== 5. УТИЛИТЫ =====
    pdf.add_page()
    pdf.chapter_title('5. Утилиты: очистка и переименование')

    pdf.section_title('cleanup.py (Наблюдатель)')
    pdf.body(
        'Удаляет лишние файлы из output/, оставляя только:\n'
        '- photo_1.* (первое фото)\n'
        '- passport_1.pdf (первый паспорт)\n'
        '- *.xml файлы\n\n'
        'Запуск: python cleanup.py'
    )

    pdf.section_title('rename_docs.py (HiWatch)')
    pdf.body(
        'Переименовывает PDF по реальным названиям с сайта:\n'
        '- passport.pdf -> паспорт.pdf\n'
        '- passport_2.pdf -> сертификат.pdf\n'
        '- passport_3.pdf -> инструкция.pdf\n\n'
        'Определяет тип через AJAX-запрос к сайту hiwatch.net. '
        'Пропускает уже переименованные файлы.\n\n'
        'Запуск: python rename_docs.py'
    )

    pdf.section_title('download_files.py (Наблюдатель)')
    pdf.body(
        'Скачивает фото и паспорта из уже сохранённого products_all.json. '
        'Не перепарсивает сайт. 20 потоков. Пропускает уже скачанные.\n\n'
        'Запуск: python download_files.py'
    )

    # ===== 6. СИСТЕМА ИМПОРТА =====
    pdf.add_page()
    pdf.chapter_title('6. Система импорта в админ-панели')

    pdf.section_title('Доступ')
    pdf.body(
        'Админ-панель: http://localhost:3000/admin\n'
        'Раздел: Импорт данных -> вкладка "Папка бренда"\n\n'
        'Система автоматически сканирует корневую папку проекта и показывает '
        'все папки брендов с количеством товаров и категориями.'
    )

    pdf.section_title('Как работает импорт')
    pdf.bullet('Нажмите "Импорт" напротив нужного бренда')
    pdf.bullet('Система рекурсивно находит все product.xml файлы в папке output/')
    pdf.bullet('Парсит XML: название, артикул, бренд, категорию, характеристики, описание')
    pdf.bullet('Копирует фото и PDF в public/products/ (доступны на сайте)')
    pdf.bullet('Создаёт/обновляет товары, категории и бренды в базе данных')
    pdf.bullet('Сохраняет документы (паспорта, сертификаты) в отдельную таблицу')
    pdf.bullet('Пишет лог импорта в журнал аудита')

    pdf.section_title('Поддерживаемые форматы XML')
    pdf.body('Импортёр понимает два формата:')
    pdf.subsection('Формат 1: Наблюдатель')
    pdf.code(
        '<product>\n'
        '  <name>Бренд, Модель</name>\n'
        '  <article>Артикул</article>\n'
        '  <brand>Бренд</brand>\n'
        '  <spec name="Ключ">Значение</spec>\n'
        '  <local_image>photo_1.jpg</local_image>\n'
        '  <local_passport>passport.pdf</local_passport>\n'
        '</product>'
    )
    pdf.subsection('Формат 2: HiWatch')
    pdf.code(
        '<product>\n'
        '  <name>Полное название</name>\n'
        '  <model>DS-I253M(C)</model>\n'
        '  <product_url>https://...</product_url>\n'
        '  <spec><name>Ключ</name><value>Значение</value></spec>\n'
        '  <image>image.jpg</image>\n'
        '  <passport>passport.pdf</passport>\n'
        '</product>'
    )

    pdf.section_title('Карточка товара на сайте')
    pdf.body(
        'После импорта товар доступен в каталоге. Карточка товара содержит три вкладки:\n\n'
        '1) Характеристики - таблица с параметрами\n'
        '2) Описание - текст описания\n'
        '3) Документация - паспорта, сертификаты, инструкции (PDF для скачивания)\n\n'
        'Вкладка "Документация" появляется только если у товара есть PDF-документы.'
    )

    # ===== 7. ДОБАВЛЕНИЕ НОВОГО БРЕНДА =====
    pdf.add_page()
    pdf.chapter_title('7. Добавление нового бренда')

    pdf.body(
        'Чтобы добавить новый бренд на сайт, нужно:\n\n'
        '1) Написать парсер для сайта поставщика\n'
        '2) Запустить парсер\n'
        '3) Импортировать через админ-панель'
    )

    pdf.section_title('Шаг 1: Создать папку парсера')
    pdf.code(
        'C:\\Курсор\\Наш сайт\\Сайт\\НовыйБренд\\\n'
        '+-- parser.py        # или main.py\n'
        '+-- requirements.txt\n'
        '+-- output/          # Создаётся автоматически'
    )

    pdf.section_title('Шаг 2: Написать парсер')
    pdf.body(
        'Парсер должен:\n'
        '- Обойти все категории и товары на сайте поставщика\n'
        '- Для каждого товара создать папку в output/Категория/Модель/\n'
        '- Сохранить product.xml с данными товара\n'
        '- Скачать фото как image.jpg (или photo_1.jpg)\n'
        '- Скачать паспорт/сертификат как PDF файлы\n\n'
        'Используйте HiWatch парсер как шаблон - он модульный и хорошо структурирован.'
    )

    pdf.section_title('Шаг 3: Запустить парсер')
    pdf.code(
        'cd C:\\Курсор\\Наш сайт\\Сайт\\НовыйБренд\n'
        'pip install -r requirements.txt\n'
        'python main.py'
    )

    pdf.section_title('Шаг 4: Импортировать на сайт')
    pdf.body(
        '1) Откройте http://localhost:3000/admin/import\n'
        '2) Перейдите на вкладку "Папка бренда"\n'
        '3) Нажмите "Обновить" - новая папка появится в списке\n'
        '4) Нажмите "Импорт" напротив неё\n'
        '5) Дождитесь завершения'
    )

    pdf.section_title('Требования к product.xml')
    pdf.body(
        'Обязательные поля:\n'
        '- <name> или <model> - название/модель товара\n'
        '- <article> или <model> - артикул для уникальности\n\n'
        'Желательные поля:\n'
        '- <brand> - бренд\n'
        '- <category> - категория\n'
        '- <description> - описание\n'
        '- <spec> - характеристики\n'
        '- <image> - фото (имя локального файла или URL)\n'
        '- <passport> - PDF документ (имя файла)\n'
        '- <product_url> или <source_url> - ссылка на оригинал'
    )

    # ===== 8. УСТРАНЕНИЕ ПРОБЛЕМ =====
    pdf.add_page()
    pdf.chapter_title('8. Устранение проблем')

    pdf.section_title('Парсер зависает или работает медленно')
    pdf.bullet('Проверьте доступ к сайту: откройте URL в браузере')
    pdf.bullet('Сайт может блокировать по IP - подождите 10-15 минут')
    pdf.bullet('Уменьшите количество потоков (WORKERS) в настройках парсера')

    pdf.section_title('Импорт показывает 0 добавлено')
    pdf.bullet('Проверьте что в output/ есть файлы product.xml')
    pdf.bullet('Проверьте что XML содержит <article> или <model>')
    pdf.bullet('Перезапустите dev-сервер после изменений в Prisma-схеме')
    pdf.bullet('Посмотрите список ошибок в результате импорта')

    pdf.section_title('Нет характеристик / пустые спеки')
    pdf.bullet('HiWatch: характеристики в mini_desc через ";", name может быть пустым - это нормально')
    pdf.bullet('Наблюдатель: характеристики в таблицах, парсятся через <spec name="...">...</spec>')

    pdf.section_title('Нет фото на сайте после импорта')
    pdf.bullet('Убедитесь что фото скачаны в папку товара (image.jpg или photo_1.*)')
    pdf.bullet('Проверьте что файлы скопировались в app/public/products/')
    pdf.bullet('Если фото по URL - проверьте что URL доступен')

    pdf.section_title('PDF не отображаются во вкладке "Документация"')
    pdf.bullet('Переимпортируйте бренд - документы сохраняются при импорте')
    pdf.bullet('PDF файлы должны лежать в папке товара рядом с product.xml')
    pdf.bullet('Названия файлов: паспорт.pdf, сертификат.pdf, инструкция.pdf (или passport*.pdf)')

    pdf.section_title('Prisma ошибки при импорте')
    pdf.code(
        '# Остановите dev-сервер\n'
        'taskkill /PID <PID> /F\n'
        '\n'
        '# Перегенерируйте Prisma client\n'
        'cd C:\\Курсор\\Наш сайт\\Сайт\\app\n'
        'npx prisma generate\n'
        '\n'
        '# Запустите заново\n'
        'npm run dev'
    )

    pdf.section_title('Пустые категории/бренды в каталоге')
    pdf.body(
        'API автоматически фильтрует пустые категории и бренды (без товаров). '
        'Если всё равно видите пустые - очистите кэш браузера (Ctrl+Shift+R).'
    )

    # ===== СОХРАНЕНИЕ =====
    output_path = 'C:/Курсор/Наш сайт/Сайт/Инструкция_парсеры.pdf'
    pdf.output(output_path)
    print(f'PDF сохранён: {output_path}')
    print(f'Страниц: {pdf.page_no()}')


if __name__ == '__main__':
    generate()
