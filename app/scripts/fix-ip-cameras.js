const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Classify product by SKU and name into the right category
function classify(sku, name) {
  const s = (sku || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Use the real model from name if SKU is numeric
  const model = /^\d{4,}/.test(s) ? n : s;

  // --- Registrators ---
  if (model.match(/ds-[78]\d{3}/) || model.match(/ids-[78]\d{3}/) ||
      model.startsWith('ds-n') || model.startsWith('ds-h') ||
      model.startsWith('dvr') || model.startsWith('nvr') ||
      n.includes('регистратор') || n.includes('видеорегистратор')) {
    // IP or analog?
    if (model.startsWith('ds-n') || model.startsWith('nvr') ||
        model.match(/ds-[78]\d{3}n/) || model.match(/ids-[78]\d{3}n/) ||
        n.includes('ip-видеорегистратор') || n.includes('ip видеорегистратор')) {
      return 'regIP';
    }
    return 'regAnalog';
  }

  // --- Brackets/mounting ---
  if (n.includes('кронштейн') || n.includes('монтажн') || n.includes('козырёк') ||
      n.includes('адаптер') || n.includes('распред') ||
      model.match(/ds-1[2-9]\d{2}/) || model.match(/ds-16\d{2}/)) {
    return 'acc';
  }

  // --- Thermal ---
  if (model.startsWith('ds-2td') || model.startsWith('ds-2ta') ||
      model.startsWith('ds-2tm') || model.startsWith('ds-2tx') ||
      n.includes('тепловизор') || n.includes('thermal')) {
    return 'thermal';
  }

  // --- Microphones ---
  if (n.includes('микрофон')) return 'acc';

  // --- Network ---
  if (n.includes('коммутатор') || n.includes('switch') || n.includes('маршрутизатор')) return 'network';

  // --- SKUD ---
  if (n.includes('контролл') || n.includes('считыват') || n.includes('турникет') || n.includes('замок')) return 'skud';

  // --- Alarm ---
  if (n.includes('датчик') || n.includes('извещат') || n.includes('сигнализ')) return 'alarm';

  // --- Domofony ---
  if (n.includes('домофон') || n.includes('вызывн') || n.includes('панель вызова')) return 'domofony';

  // --- Analog cameras ---
  if (model.startsWith('ds-2ce') || model.startsWith('ds-t') || model.startsWith('hdc-') ||
      model.startsWith('ae-vc') || model.startsWith('ds-2cc') ||
      n.includes('tvi') || n.includes('аналогов')) {
    return 'camAnalog';
  }

  // --- IP cameras (all remaining DS-2* are cameras of various types) ---
  // DS-2CD, DS-2DE, DS-2DF, DS-2XM, DS-2XE, DS-2XS, DS-2XT, DS-2XC, DS-2SE, DS-2PT, DS-2DP, DS-2DB, DS-2AE, DS-2AF, DS-2DY, DS-2SF
  // DS-I*, IPC-*, TC-*, PTZ-N*, iDS-2CD*, DS-U*, DS-UVC*, DS-2CS*, DS-MH*
  if (model.startsWith('ds-2') || model.startsWith('ids-2') ||
      model.startsWith('ds-i') || model.startsWith('ipc-') ||
      model.startsWith('tc-') || model.startsWith('ptz-') ||
      model.startsWith('ds-u') || model.startsWith('ds-mh') ||
      model.startsWith('ds-2cs') ||
      n.includes('камера') || n.includes('видеокамера') || n.includes('ip-камера') ||
      n.includes('minidome') || n.includes('bullet') || n.includes('dome') || n.includes('turret')) {
    return 'camIP';
  }

  // Default: IP camera (most Hikvision products in this category are cameras)
  return 'camIP';
}

async function main() {
  // Get target categories
  const cats = {};
  for (const slug of ['ip-kamery', 'analogovye-kamery', 'ip-videoregistratory', 'analogovye-videoregistratory',
                       'aksessuary', 'domofony', 'skud', 'okhrannaya-signalizatsiya',
                       'setevoe-oborudovanie', 'teplovizionnoe-oborudovanie']) {
    const cat = await p.category.findUnique({ where: { slug } });
    if (cat) cats[slug] = cat.id;
  }

  const targetMap = {
    camIP: cats['ip-kamery'],
    camAnalog: cats['analogovye-kamery'],
    regIP: cats['ip-videoregistratory'],
    regAnalog: cats['analogovye-videoregistratory'],
    acc: cats['aksessuary'],
    domofony: cats['domofony'],
    skud: cats['skud'],
    alarm: cats['okhrannaya-signalizatsiya'],
    network: cats['setevoe-oborudovanie'],
    thermal: cats['teplovizionnoe-oborudovanie'],
  };

  // Get all products currently in IP-камеры
  const ipCat = await p.category.findUnique({ where: { slug: 'ip-kamery' } });
  const products = await p.product.findMany({
    where: { categoryId: ipCat.id },
    select: { id: true, sku: true, name: true }
  });

  const stats = {};
  let moved = 0;

  for (const pr of products) {
    const type = classify(pr.sku, pr.name);
    stats[type] = (stats[type] || 0) + 1;

    if (type !== 'camIP' && targetMap[type]) {
      await p.product.update({ where: { id: pr.id }, data: { categoryId: targetMap[type] } });
      moved++;
    }
  }

  console.log('Classification results:');
  for (const [type, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + type + ': ' + count + (type === 'camIP' ? ' (stays)' : ' (moved)'));
  }
  console.log('\nTotal moved out of IP-камеры:', moved);

  // Also check Аналоговые камеры for misplaced items
  const analogCat = await p.category.findUnique({ where: { slug: 'analogovye-kamery' } });
  const analogProds = await p.product.findMany({
    where: { categoryId: analogCat.id },
    select: { id: true, sku: true, name: true }
  });

  let analogMoved = 0;
  for (const pr of analogProds) {
    const type = classify(pr.sku, pr.name);
    if (type !== 'camAnalog' && targetMap[type]) {
      await p.product.update({ where: { id: pr.id }, data: { categoryId: targetMap[type] } });
      analogMoved++;
    }
  }
  if (analogMoved > 0) console.log('Moved from Аналоговые камеры:', analogMoved);

  // Final counts
  console.log('\n=== Final category structure ===');
  const final = await p.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      _count: { select: { products: true } },
      children: { include: { _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } }
    },
    orderBy: { sortOrder: 'asc' }
  });
  for (const cat of final) {
    const childCount = cat.children.reduce((sum, c) => sum + c._count.products, 0);
    const total = cat._count.products + childCount;
    if (total === 0) continue;
    console.log(cat.name + ' (' + total + ')');
    for (const child of cat.children) {
      if (child._count.products > 0) console.log('  ├ ' + child.name + ' (' + child._count.products + ')');
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect());
