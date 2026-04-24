# Парсер HiWatch (hiwatch.net)

Собирает полный каталог товаров HiWatch: фото, описания, характеристики, паспорта (PDF).

## Установка

```bash
pip install -r requirements.txt
```

## Запуск

```bash
# Полный парсинг + скачивание файлов
python main.py

# Только парсинг без скачивания фото/паспортов
python main.py --no-download
```

## Результат

```
HiWatch/output/
├── all_products.xml          # Все товары в одном XML
├── all_products.csv          # Все товары в CSV
├── parser.log                # Лог парсинга
├── IP-видеокамеры/
│   ├── Купольные камеры/
│   │   ├── DS-I253M(C)(2.8mm)/
│   │   │   ├── product.xml
│   │   │   ├── image.jpg
│   │   │   └── passport.pdf
│   │   └── ...
│   └── ...
├── Видеорегистраторы/
│   └── ...
└── ...
```
