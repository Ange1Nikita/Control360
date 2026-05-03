const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. Create/find canonical parent categories
  async function getOrCreate(name, slug, sortOrder) {
    let cat = await p.category.findUnique({ where: { slug } });
    if (!cat) cat = await p.category.create({ data: { name, slug, sortOrder, isActive: true } });
    else await p.category.update({ where: { id: cat.id }, data: { name, sortOrder, parentId: null } });
    return cat;
  }

  const cameras     = await getOrCreate('Камеры видеонаблюдения', 'kamery-videonablyudeniya', 0);
  const regs        = await getOrCreate('Видеорегистраторы', 'videoregistratory', 1);
  const domofony    = await getOrCreate('Домофоны', 'domofony', 2);
  const skud        = await getOrCreate('СКУД', 'skud', 3);
  const alarm       = await getOrCreate('Охранная сигнализация', 'okhrannaya-signalizatsiya', 4);
  const accessories = await getOrCreate('Аксессуары', 'aksessuary', 5);
  const network     = await getOrCreate('Сетевое оборудование', 'setevoe-oborudovanie', 6);
  const thermal     = await getOrCreate('Тепловизионное оборудование', 'teplovizionnoe-oborudovanie', 7);
  const vms         = await getOrCreate('VMS решения и ПО', 'vms-resheniya-i-po', 8);

  // 2. Create subcategories
  async function getOrCreateSub(name, slug, parentId, sortOrder) {
    let cat = await p.category.findUnique({ where: { slug } });
    if (!cat) cat = await p.category.create({ data: { name, slug, parentId, sortOrder, isActive: true } });
    else await p.category.update({ where: { id: cat.id }, data: { name, parentId, sortOrder } });
    return cat;
  }

  const camIP     = await getOrCreateSub('IP-камеры', 'ip-kamery', cameras.id, 0);
  const camAnalog = await getOrCreateSub('Аналоговые камеры', 'analogovye-kamery', cameras.id, 1);
  const regIP     = await getOrCreateSub('IP-видеорегистраторы', 'ip-videoregistratory', regs.id, 0);
  const regAnalog = await getOrCreateSub('Аналоговые видеорегистраторы', 'analogovye-videoregistratory', regs.id, 1);

  console.log('Categories created/updated');

  // 3. Merge simple source categories into targets
  const mergeMap = {
    'ip-videokamery': camIP.id,
    'hd-tvi-videokamery': camAnalog.id,
    'hiwatch-ecoline': camAnalog.id,
    'hd-tvi-videoregistrator': regAnalog.id,
    'domofony-i-peregovornye-ustroystva': domofony.id,
    'sredstva-i-sistemy-kontrolya-i-upravleniya-dostupom': skud.id,
    'turnikety': skud.id,
    'okhranno-pozharnaya-signalizatsiya': alarm.id,
    'sredstva-i-sistemy-okhranno-pozharnoy-signalizatsii': alarm.id,
    'hd-tvi-oborudovanie': accessories.id,
    'ip-oborudovanie': accessories.id,
    'kronshteyny': accessories.id,
  };

  for (const [srcSlug, targetId] of Object.entries(mergeMap)) {
    const src = await p.category.findUnique({ where: { slug: srcSlug } });
    if (!src) { console.log('  skip (not found):', srcSlug); continue; }
    const result = await p.product.updateMany({ where: { categoryId: src.id }, data: { categoryId: targetId } });
    console.log('  ' + srcSlug + ' -> moved ' + result.count + ' products');
  }

  // 4. Split mixed categories by SKU pattern
  function classify(sku, name) {
    const s = (sku || '').toLowerCase();
    const n = (name || '').toLowerCase();

    // Registrators
    if (s.startsWith('ds-7') || s.startsWith('ds-8') || s.startsWith('ids-7') ||
        s.startsWith('ds-h') || s.startsWith('ds-n') ||
        s.startsWith('dvr') || s.startsWith('nvr')) {
      // IP or analog registrator?
      if (s.startsWith('ds-n') || s.startsWith('nvr') || s.startsWith('ds-7') || s.startsWith('ds-8') || s.startsWith('ids-7')) return 'regIP';
      return 'regAnalog';
    }
    // Accessories
    if (n.includes('кронштейн') || n.includes('монтаж') || n.includes('адаптер') ||
        s.startsWith('ds-12') || s.startsWith('ds-16') || s.startsWith('ds-13')) return 'acc';
    // IP cameras
    if (s.startsWith('ds-2cd') || s.startsWith('ds-2de') || s.startsWith('ids-2cd') ||
        s.startsWith('ipc-') || s.startsWith('ds-i') || s.startsWith('tc-')) return 'camIP';
    // Analog cameras
    if (s.startsWith('ds-2ce') || s.startsWith('ds-t') || s.startsWith('hdc-') || s.startsWith('ae-vc')) return 'camAnalog';
    // Default: IP camera
    return 'camIP';
  }

  const targetMap = {
    camIP: camIP.id,
    camAnalog: camAnalog.id,
    regIP: regIP.id,
    regAnalog: regAnalog.id,
    acc: accessories.id,
  };

  // Split products currently in parent 'kamery-videonablyudeniya'
  const cameraProducts = await p.product.findMany({
    where: { categoryId: cameras.id },
    select: { id: true, sku: true, name: true }
  });
  const stats1 = { camIP: 0, camAnalog: 0, regIP: 0, regAnalog: 0, acc: 0 };
  for (const pr of cameraProducts) {
    const type = classify(pr.sku, pr.name);
    stats1[type]++;
    await p.product.update({ where: { id: pr.id }, data: { categoryId: targetMap[type] } });
  }
  console.log('  kamery-videonablyudeniya split:', stats1);

  // Split 'sredstva-i-sistemy-okhrannogo-televideniya'
  const sotv = await p.category.findUnique({ where: { slug: 'sredstva-i-sistemy-okhrannogo-televideniya' } });
  if (sotv) {
    const prods = await p.product.findMany({ where: { categoryId: sotv.id }, select: { id: true, sku: true, name: true } });
    const stats2 = { camIP: 0, camAnalog: 0, regIP: 0, regAnalog: 0, acc: 0 };
    for (const pr of prods) {
      const type = classify(pr.sku, pr.name);
      stats2[type]++;
      await p.product.update({ where: { id: pr.id }, data: { categoryId: targetMap[type] } });
    }
    console.log('  sredstva-i-sistemy-okhrannogo-televideniya split:', stats2);
  }

  // 5. Move DVR-* from analog cameras to analog registrators
  const ecoRegs = await p.product.findMany({
    where: { categoryId: camAnalog.id, sku: { startsWith: 'DVR' } },
    select: { id: true }
  });
  if (ecoRegs.length > 0) {
    await p.product.updateMany({
      where: { id: { in: ecoRegs.map(r => r.id) } },
      data: { categoryId: regAnalog.id }
    });
    console.log('  Moved ' + ecoRegs.length + ' DVR products to analog registrators');
  }

  // 6. Delete empty non-canonical categories
  const keepSlugs = new Set([
    'kamery-videonablyudeniya', 'ip-kamery', 'analogovye-kamery',
    'videoregistratory', 'ip-videoregistratory', 'analogovye-videoregistratory',
    'domofony', 'skud', 'okhrannaya-signalizatsiya', 'aksessuary',
    'setevoe-oborudovanie', 'teplovizionnoe-oborudovanie', 'vms-resheniya-i-po',
  ]);

  const allCats = await p.category.findMany({
    include: { _count: { select: { products: true, children: true } } }
  });

  let deleted = 0;
  for (const cat of allCats) {
    if (!keepSlugs.has(cat.slug) && cat._count.products === 0 && cat._count.children === 0) {
      await p.category.delete({ where: { id: cat.id } });
      deleted++;
    }
  }
  console.log('Deleted ' + deleted + ' empty categories');

  // 7. Final counts
  console.log('\n=== Final category structure ===');
  const final = await p.category.findMany({
    where: { parentId: null },
    include: {
      _count: { select: { products: true } },
      children: { include: { _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } }
    },
    orderBy: { sortOrder: 'asc' }
  });
  for (const cat of final) {
    const childCount = cat.children.reduce((sum, c) => sum + c._count.products, 0);
    const total = cat._count.products + childCount;
    console.log(cat.name + ' (' + total + ')');
    for (const child of cat.children) {
      console.log('  \u251C ' + child.name + ' (' + child._count.products + ')');
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect());
