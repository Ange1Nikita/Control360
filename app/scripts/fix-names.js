const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const prods = await p.product.findMany({
    select: { id: true, sku: true, name: true, brand: { select: { name: true } }, description: true, attributes: { select: { name: true, value: true } } },
    where: { isActive: true }
  });

  let fixed = 0;
  let skipped = 0;

  for (const pr of prods) {
    const n = pr.name;
    const brand = pr.brand?.name || '';

    // Is the name garbage?
    const isGarbage =
      // Short name without model prefix
      (n.length < 15 && !n.match(/^(DS-|IPC-|TC-|PTZ-|HDC-|DVR-|NVR-|AE-|VDP-)/i)) ||
      // Name is just "Brand SKU"
      n === `${brand} ${pr.sku}` ||
      // Name is just the SKU number
      n === pr.sku;

    if (!isGarbage) continue;

    // Try to build a good name
    let newName = null;

    // 1. Check attributes for "Модель" or "Артикул производителя"
    const modelAttr = pr.attributes.find(a =>
      a.name.toLowerCase().includes('модель') || a.name.toLowerCase().includes('артикул')
    );
    if (modelAttr && modelAttr.value && modelAttr.value.length > 3) {
      newName = brand ? `${brand} ${modelAttr.value}` : modelAttr.value;
    }

    // 2. Try to extract a meaningful name from description
    if (!newName && pr.description) {
      const desc = pr.description
        .replace(/<\/?paragraph>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Take first sentence/clause up to a reasonable length
      const firstPart = desc.substring(0, 120).split(';')[0].trim();
      if (firstPart.length > 10) {
        // Capitalize first letter
        const cleaned = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
        newName = brand ? `${brand} ${pr.sku} — ${cleaned}` : `${pr.sku} — ${cleaned}`;
      }
    }

    // 3. Fallback: Brand + SKU + short name if name has some info
    if (!newName && n.length > 2 && n !== pr.sku) {
      newName = brand ? `${brand} ${n}` : n;
    }

    if (!newName) {
      skipped++;
      continue;
    }

    // Truncate if too long
    if (newName.length > 200) newName = newName.substring(0, 197) + '...';

    await p.product.update({ where: { id: pr.id }, data: { name: newName } });
    fixed++;
    if (fixed <= 20) console.log(`  ${pr.sku}: "${pr.name}" -> "${newName}"`);
  }

  console.log(`\nFixed: ${fixed}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => p.$disconnect());
