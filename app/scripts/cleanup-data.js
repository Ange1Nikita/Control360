const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function mergeCategory(sourceNames, targetName) {
  const target = await p.category.findFirst({ where: { name: targetName } });
  if (!target) { console.log(`  Target "${targetName}" not found, skipping`); return }

  for (const srcName of sourceNames) {
    const src = await p.category.findFirst({ where: { name: srcName } });
    if (!src || src.id === target.id) continue;
    const count = await p.product.count({ where: { categoryId: src.id } });
    await p.product.updateMany({ where: { categoryId: src.id }, data: { categoryId: target.id } });
    await p.category.delete({ where: { id: src.id } }).catch(() => {});
    console.log(`  "${srcName}" (${count}) → "${targetName}"`);
  }
}

async function main() {
  console.log('=== MERGING CATEGORIES ===');

  await mergeCategory(['IP Видеокамеры купольные', 'IP видеокамеры цилиндрические', 'IP Видеокамеры Скоростные Поворотные', 'TVI-камеры', 'TVI видеокамеры', 'Аналоговые видеокамеры', 'HD-SDI видеокамеры'], 'Камеры видеонаблюдения');
  await mergeCategory(['IP видеорегистраторы', 'TVI видеорегистраторы', 'Аналоговые видеорегистраторы', 'HD-SDI видеорегистраторы', 'TVI-регистраторы', 'IP-регистраторы'], 'Видеорегистраторы');
  await mergeCategory(['IP Вызывные панели'], 'Вызывные панели');
  await mergeCategory(['IP-домофоны', 'MHD-домофоны', 'Комплекты домофонов', 'Рамки для домофонов'], 'Домофоны');
  await mergeCategory(['PoE-коммутаторы', 'Коммутаторы'], 'Сетевое оборудование');
  await mergeCategory(['Экстендеры камер', 'Экстендеры мониторов'], 'Аксессуары');

  // Handle "Проектные решения" if exists
  const projCat = await p.category.findFirst({ where: { name: { contains: 'Проектные решения' } } });
  if (projCat) {
    const target = await p.category.findFirst({ where: { name: 'Комплекты видеонаблюдения' } });
    if (target) {
      await p.product.updateMany({ where: { categoryId: projCat.id }, data: { categoryId: target.id } });
      await p.category.delete({ where: { id: projCat.id } }).catch(() => {});
      console.log('  "Проектные решения" → "Комплекты видеонаблюдения"');
    }
  }

  // Handle "Другое" category
  console.log('\n=== CLEANING "Другое" CATEGORY ===');
  const drugoeCat = await p.category.findFirst({ where: { name: 'Другое' } });
  if (drugoeCat) {
    const products = await p.product.findMany({ where: { categoryId: drugoeCat.id }, select: { id: true, name: true, sku: true } });
    console.log(`  Found ${products.length} products in "Другое"`);

    const patterns = [
      { test: /камер|camer|ipc|bullet|dome|turret/i, target: 'Камеры видеонаблюдения' },
      { test: /регистратор|dvr|nvr|xvr/i, target: 'Видеорегистраторы' },
      { test: /домофон|monitor.*видео|ivd|icp/i, target: 'Домофоны' },
      { test: /замок|замк|lock|электро.*замок/i, target: 'Замки' },
      { test: /датчик|сигнализ|sensor|alarm|извещат/i, target: 'Охранная сигнализация' },
      { test: /коммутатор|switch|poe|сетев/i, target: 'Сетевое оборудование' },
      { test: /кабель|провод|cable/i, target: 'Кабельная продукция' },
      { test: /кронштейн|монтаж|bracket|mount/i, target: 'Аксессуары' },
      { test: /скуд|контрол.*доступ|считыват|zkteco/i, target: 'СКУД' },
      { test: /жёст|hdd|hard.*disk/i, target: 'Жёсткие диски' },
    ];

    const catCache = {};
    let moved = 0;
    for (const prod of products) {
      const text = `${prod.name} ${prod.sku || ''}`;
      let targetName = 'Аксессуары'; // default
      for (const pat of patterns) {
        if (pat.test.test(text)) { targetName = pat.target; break; }
      }
      if (!catCache[targetName]) {
        catCache[targetName] = await p.category.findFirst({ where: { name: targetName } });
      }
      if (catCache[targetName]) {
        await p.product.update({ where: { id: prod.id }, data: { categoryId: catCache[targetName].id } });
        moved++;
      }
    }
    console.log(`  Moved ${moved} products to proper categories`);
    await p.category.delete({ where: { id: drugoeCat.id } }).catch(() => {});
    console.log('  Deleted "Другое" category');
  }

  // Handle "Другое" brand
  console.log('\n=== CLEANING "Другое" BRAND ===');
  const drugoeBrand = await p.brand.findFirst({ where: { OR: [{ name: 'Другое' }, { slug: 'drugoe' }] } });
  if (drugoeBrand) {
    const products = await p.product.findMany({ where: { brandId: drugoeBrand.id }, select: { id: true, name: true } });
    console.log(`  Found ${products.length} products with brand "Другое"`);

    const knownBrands = ['Dahua', 'Hikvision', 'HiWatch', 'EZVIZ', 'IMOU', 'Tiandy', 'Uniview', 'ZKTeco', 'FOX', 'KENO', 'ViGUARD', 'CTV', 'Slinex', 'Tantos', 'Bolid', 'Falcon Eye', 'iFLOW', 'DoorHan', 'CAME', 'BFT', 'Accordtec'];
    const brandCache = {};
    let reassigned = 0;

    for (const prod of products) {
      let foundBrand = null;
      for (const bn of knownBrands) {
        if (prod.name.toLowerCase().includes(bn.toLowerCase())) {
          if (!brandCache[bn]) {
            brandCache[bn] = await p.brand.findFirst({ where: { name: { equals: bn } } });
          }
          foundBrand = brandCache[bn];
          break;
        }
      }
      if (foundBrand) {
        await p.product.update({ where: { id: prod.id }, data: { brandId: foundBrand.id } });
        reassigned++;
      } else {
        await p.product.update({ where: { id: prod.id }, data: { brandId: null } });
      }
    }
    console.log(`  Reassigned ${reassigned} to proper brands, ${products.length - reassigned} set to null`);
    await p.brand.delete({ where: { id: drugoeBrand.id } }).catch(() => {});
    console.log('  Deleted "Другое" brand');
  }

  // Delete empty categories
  console.log('\n=== DELETING EMPTY CATEGORIES ===');
  const emptyCats = await p.category.findMany({ where: { products: { none: {} } } });
  for (const cat of emptyCats) {
    await p.category.delete({ where: { id: cat.id } }).catch(() => {});
    console.log(`  Deleted empty: "${cat.name}"`);
  }

  // Delete unused seed brands
  console.log('\n=== DELETING EMPTY BRANDS ===');
  const emptyBrands = await p.brand.findMany({ where: { products: { none: {} } } });
  for (const b of emptyBrands) {
    await p.brand.delete({ where: { id: b.id } }).catch(() => {});
    console.log(`  Deleted empty: "${b.name}"`);
  }

  // Final stats
  console.log('\n=== FINAL STATS ===');
  const cats = await p.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  for (const c of cats) console.log(`  ${String(c._count.products).padStart(5)} ${c.name}`);
  console.log(`  Total products: ${await p.product.count()}`);
  console.log(`  Without category: ${await p.product.count({ where: { categoryId: null } })}`);

  console.log('\nDone!');
}

main().catch(console.error).finally(() => p.$disconnect());
