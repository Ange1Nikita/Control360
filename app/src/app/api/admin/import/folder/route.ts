import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'
import { slugify } from '@/lib/utils'
import fs from 'fs'
import path from 'path'

// Category normalization map — merge duplicates into canonical names
const CATEGORY_MAP: Record<string, string> = {
  'ip камеры': 'IP-камеры',
  'ip камеры ': 'IP-камеры',
  'ip-камеры': 'IP-камеры',
  'ip-видеокамеры': 'IP-камеры',
  'ip видеокамеры': 'IP-камеры',
  'tvi камеры': 'Аналоговые камеры',
  'hd-tvi-видеокамеры': 'Аналоговые камеры',
  'hd-tvi видеокамеры': 'Аналоговые камеры',
  'hiwatch ecoline': 'Аналоговые камеры',
  'tvi регистраторы': 'Аналоговые видеорегистраторы',
  'hd-tvi видеорегистратор': 'Аналоговые видеорегистраторы',
  'hd-tvi регистраторы': 'Аналоговые видеорегистраторы',
  'ip регистраторы': 'IP-видеорегистраторы',
  'ip-видеорегистраторы': 'IP-видеорегистраторы',
  'ip видеорегистраторы': 'IP-видеорегистраторы',
  'ip домофоны': 'Домофоны',
  'ip домофоны космос': 'Домофоны',
  'mhd домофоны': 'Домофоны',
  'домофоны и переговорные устройства': 'Домофоны',
  'домофония': 'Домофоны',
  'poe коммутаторы': 'Сетевое оборудование',
  'коммутаторы': 'Сетевое оборудование',
  'узлы коммутации': 'Сетевое оборудование',
  'wifi4g камеры': 'IP-камеры',
  'wifi/4g камеры': 'IP-камеры',
  '4g камеры': 'IP-камеры',
  '4g wi-fi камеры': 'IP-камеры',
  'wi-fi камеры': 'IP-камеры',
  'вызывные панели': 'Домофоны',
  'домофоны комплекты': 'Домофоны',
  'домофоны рамки': 'Домофоны',
  'аксессуары': 'Аксессуары',
  'аудиотрубки': 'Домофоны',
  'замки': 'СКУД',
  'умный дом': 'Аксессуары',
  'камеры видеонаблюдения': 'IP-камеры',
  'средства и системы охранного телевидения': 'IP-камеры',
  'видеорегистраторы': 'IP-видеорегистраторы',
  'домофоны': 'Домофоны',
  'жёсткие диски': 'Аксессуары',
  'кабельная продукция': 'Аксессуары',
  'микрофоны': 'Аксессуары',
  'объективы': 'Аксессуары',
  'охранная сигнализация': 'Охранная сигнализация',
  'охранно-пожарная сигнализация': 'Охранная сигнализация',
  'средства и системы охранно-пожарной сигнализации': 'Охранная сигнализация',
  'приёмопередатчики': 'Аксессуары',
  'разъёмы и переходники': 'Аксессуары',
  'сетевое оборудование': 'Сетевое оборудование',
  'скуд': 'СКУД',
  'средства и системы контроля и управления доступом': 'СКУД',
  'turnikety': 'СКУД',
  'контроль доступа (скуд)': 'СКУД',
  'автоматика ворот': 'СКУД',
  'готовые комплекты': 'Аксессуары',
  'комплекты видеонаблюдения': 'Аксессуары',
  'источники питания': 'Аксессуары',
  'кронштейны': 'Аксессуары',
  'hd-tvi-оборудование': 'Аксессуары',
  'ip-оборудование': 'Аксессуары',
  'тепловизионное оборудование': 'Тепловизионное оборудование',
  'vms решения и по': 'VMS решения и ПО',
}

// Junk categories to skip
const SKIP_CATEGORIES = new Set(['все товары', 'catalog', 'каталог'])

// Junk folder names to skip
const SKIP_FOLDERS = new Set(['INDEX.PHP', 'INDEX.PHPSORT', 'INDEX.PHPVIEW', 'photos', '__pycache__'])

function normalizeCategory(raw: string): string | null {
  const lower = raw.toLowerCase().trim()
  if (SKIP_CATEGORIES.has(lower)) return null
  return CATEGORY_MAP[lower] || raw.trim()
}

// Try to extract real category from name like "Каталог/IP Домофоны/KN-100C2"
function extractCategoryFromName(name: string): string | null {
  if (!name.includes('/')) return null
  const parts = name.split('/').map(p => p.trim()).filter(Boolean)
  // Pattern: "Каталог/CategoryName/ProductName" or "Проектные решения/SubCategory/ProductName"
  if (parts.length >= 2) {
    // Skip first part if it's "Каталог" or similar
    const startIdx = (parts[0] === 'Каталог' || parts[0].includes('Проектные')) ? 1 : 0
    if (parts.length > startIdx + 1) {
      return parts[startIdx]
    }
  }
  return null
}

// Parse product.xml content
function parseProductXml(xmlText: string) {
  const get = (tag: string) => {
    const m = xmlText.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
    return m ? m[1].trim() : ''
  }

  const name = get('name')
  const article = get('article') || get('model') // HiWatch uses <model> instead of <article>
  const brand = get('brand')
  const category = get('category')
  const priceRaw = get('price')
  const description = get('description')
  const sourceUrl = get('source_url') || get('product_url')

  let price = 0
  if (priceRaw) {
    const p = parseFloat(priceRaw.replace(/[^\d.]/g, ''))
    if (!isNaN(p) && p > 0 && p < 10000000) price = p
  }

  const localImages: string[] = []
  const remoteImages: string[] = []

  // <local_image> — always local
  const localImgMatches = xmlText.matchAll(/<local_image>(.*?)<\/local_image>/g)
  for (const m of localImgMatches) localImages.push(m[1].trim())

  // <image> — can be URL (remote) or filename (local)
  const imgMatches = xmlText.matchAll(/<image>(.*?)<\/image>/g)
  for (const m of imgMatches) {
    const val = m[1].trim()
    if (!val) continue
    if (val.startsWith('http')) {
      // Remote image — filter junk
      if (!val.includes('/38_24_') &&
        !val.includes('.svg') && !val.includes('.svgz') &&
        !val.includes('exit.') && !val.includes('size.') &&
        !val.includes('lens.') && !val.includes('box.') &&
        !val.includes('diagonal.') && !val.includes('hands-free.') &&
        !val.includes('ip.') && !val.includes('footer-') &&
        !val.includes('product-mini') && !val.includes('solutions-mini') && !val.includes('support-mini')) {
        remoteImages.push(val)
      }
    } else if (val.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      // Local filename (e.g. "image.jpg" from HiWatch parser)
      localImages.push(val)
    }
  }

  const specs: { name: string; value: string }[] = []
  // Format 1: <spec name="Key">Value</spec> (Наблюдатель)
  const specMatches1 = xmlText.matchAll(/<spec name="(.*?)">(.*?)<\/spec>/g)
  for (const m of specMatches1) {
    const specName = m[1].trim()
    const specValue = m[2].trim()
    if (specName && specValue && specName !== specValue) {
      specs.push({ name: specName, value: specValue })
    }
  }
  // Format 2: <spec><name>Key</name><value>Value</value></spec> (HiWatch)
  // Also handles <name /> (self-closing empty name)
  const specMatches2 = xmlText.matchAll(/<spec>[\s\S]*?(?:<name>(.*?)<\/name>|<name\s*\/>)[\s\S]*?<value>(.*?)<\/value>[\s\S]*?<\/spec>/g)
  for (const m of specMatches2) {
    const specName = (m[1] || '').trim()
    const specValue = (m[2] || '').trim()
    if (specValue && specValue.length > 2) {
      specs.push({ name: specName, value: specValue })
    }
  }

  // Passport files (local)
  const localPassports: string[] = []
  const passportMatches = xmlText.matchAll(/<passport>(.*?)<\/passport>/g)
  for (const m of passportMatches) {
    const val = m[1].trim()
    if (val && val !== 'отсутствует' && val.match(/\.(pdf)$/i)) {
      localPassports.push(val)
    }
  }
  // Also check <local_passport>
  const lpMatches = xmlText.matchAll(/<local_passport>(.*?)<\/local_passport>/g)
  for (const m of lpMatches) {
    const val = m[1].trim()
    if (val && val.match(/\.(pdf)$/i)) {
      localPassports.push(val)
    }
  }

  return { name, article, brand, category, description, sourceUrl, price, localImages, remoteImages, localPassports, specs }
}

// Determine brand from folder path: .../BrandName/output/...
function getBrandFromPath(xmlPath: string): string | null {
  const parts = xmlPath.replace(/\\/g, '/').split('/')
  const outputIdx = parts.lastIndexOf('output')
  if (outputIdx > 0) {
    return parts[outputIdx - 1] // Folder right before "output" is the brand
  }
  return null
}

// Determine category from folder path: .../output/CategoryName/Brand/Article/product.xml
function getCategoryFromPath(xmlPath: string): string | null {
  const parts = xmlPath.replace(/\\/g, '/').split('/')
  const outputIdx = parts.lastIndexOf('output')
  if (outputIdx >= 0 && outputIdx + 1 < parts.length) {
    return parts[outputIdx + 1] // Folder right after "output" is the category
  }
  return null
}

// Determine a clean product name
function cleanProductName(rawName: string, article: string, brand: string): string {
  // If article looks like a real model name (e.g. DS-I253M, IPC-B042), prefer brand + article
  if (article && article.length > 5 && /[A-Z]{2,}/.test(article)) {
    if (brand && !article.toLowerCase().startsWith(brand.toLowerCase())) {
      return `${brand} ${article}`
    }
    return article
  }

  // If name looks good (no slashes, not just a number, has enough chars), use it
  if (!rawName.includes('/') && rawName.length > 8 && !/^\d+[-\s]/.test(rawName)) {
    return rawName
  }

  // Try to get model name from the end of a path-like name
  if (rawName.includes('/')) {
    const parts = rawName.split('/').map(p => p.trim())
    const last = parts[parts.length - 1]
    // If the last part is a reasonable product name (not a number, has chars)
    if (last.length > 5 && !/^\d+$/.test(last)) {
      return last
    }
  }

  // Fallback: use brand + article
  if (article && brand) {
    return `${brand} ${article}`
  }
  if (article) return article
  return rawName
}

// Predefined brand folder locations (resolve relative to project root's parent)
const BRAND_ALIASES: Record<string, string> = {
  'FOX': 'FOX',
  'KENO': 'KENO',
  'Viguard': 'Viguard',
  'nabludatel': 'Наблюдатель',
}

export async function POST(req: NextRequest) {
  // Auth check disabled
const { folderPath, brandAlias } = await req.json()

  let basePath: string
  if (brandAlias && BRAND_ALIASES[brandAlias]) {
    // Use predefined path relative to project root's parent
    const projectRoot = path.resolve(process.cwd(), '..')
    basePath = path.join(projectRoot, BRAND_ALIASES[brandAlias])
  } else if (folderPath) {
    basePath = path.resolve(folderPath)
  } else {
    return err('Укажите путь к папке или brandAlias')
  }

  if (!fs.existsSync(basePath)) {
    return err(`Папка не найдена: ${basePath}`)
  }

  // Find all product.xml files recursively, skip junk folders
  const productFiles: string[] = []
  function findProducts(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          // Skip junk folders
          if (SKIP_FOLDERS.has(entry.name) || entry.name.startsWith('INDEX.PHP')) continue
          findProducts(fullPath)
        } else if (entry.name === 'product.xml') {
          productFiles.push(fullPath)
        }
      }
    } catch { /* skip */ }
  }
  findProducts(basePath)

  if (productFiles.length === 0) {
    return err('Не найдено файлов product.xml')
  }

  const log = await prisma.importLog.create({
    data: { type: 'PRODUCTS_XML', status: 'PROCESSING', filename: path.basename(basePath), totalRows: productFiles.length },
  })

  const publicDir = path.resolve(process.cwd(), 'public', 'products')
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

  const categoryCache: Map<string, string> = new Map()
  const brandCache: Map<string, string> = new Map()

  let imported = 0
  let updated = 0
  let errors = 0
  let skipped = 0
  const errorList: string[] = []

  for (const xmlPath of productFiles) {
    try {
      const xmlContent = fs.readFileSync(xmlPath, 'utf-8')
      const product = parseProductXml(xmlContent)
      const productDir = path.dirname(xmlPath)

      // Skip garbage entries
      if (!product.article || product.article === 'CATALOG' || product.name === 'Catalog') {
        skipped++
        continue
      }

      // === DETERMINE CATEGORY ===
      // Priority: 1) folder path, 2) name path extraction, 3) XML category
      let categoryName: string | null = null

      // 1. From folder structure (most reliable)
      const folderCategory = getCategoryFromPath(xmlPath)
      if (folderCategory) {
        categoryName = normalizeCategory(folderCategory)
      }

      // 2. If folder category is junk, try extracting from name
      if (!categoryName) {
        const nameCategory = extractCategoryFromName(product.name)
        if (nameCategory) {
          categoryName = normalizeCategory(nameCategory)
        }
      }

      // 3. Fall back to XML category
      if (!categoryName && product.category) {
        categoryName = normalizeCategory(product.category)
      }

      // === CLEAN PRODUCT NAME ===
      const cleanName = cleanProductName(product.name, product.article, product.brand)

      // === GET OR CREATE BRAND ===
      let brandId: string | null = null
      const brandName = product.brand || getBrandFromPath(xmlPath)
      if (brandName) {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-')
        if (brandCache.has(brandSlug)) {
          brandId = brandCache.get(brandSlug)!
        } else {
          let brand = await prisma.brand.findUnique({ where: { slug: brandSlug } })
          if (!brand) {
            brand = await prisma.brand.create({
              data: { name: brandName, slug: brandSlug, isActive: true },
            })
          }
          brandId = brand.id
          brandCache.set(brandSlug, brandId)
        }
      }

      // === GET OR CREATE CATEGORY ===
      let categoryId: string | null = null
      if (categoryName) {
        const catSlug = slugify(categoryName)
        if (categoryCache.has(catSlug)) {
          categoryId = categoryCache.get(catSlug)!
        } else {
          let category = await prisma.category.findUnique({ where: { slug: catSlug } })
          if (!category) {
            category = await prisma.category.create({
              data: { name: categoryName, slug: catSlug, isActive: true },
            })
          }
          categoryId = category.id
          categoryCache.set(catSlug, categoryId)
        }
      }

      // === COPY LOCAL PHOTOS ===
      const sku = product.article
      const imageUrls: string[] = []
      if (product.localImages.length > 0) {
        const productImgDir = path.join(publicDir, slugify(sku))
        if (!fs.existsSync(productImgDir)) fs.mkdirSync(productImgDir, { recursive: true })

        for (const localImg of product.localImages) {
          const srcPath = path.join(productDir, localImg)
          if (fs.existsSync(srcPath)) {
            const destName = localImg.toLowerCase()
            const destPath = path.join(productImgDir, destName)
            try {
              fs.copyFileSync(srcPath, destPath)
              imageUrls.push(`/products/${slugify(sku)}/${destName}`)
            } catch { /* skip */ }
          }
        }
      }

      // === COPY ALL PDF DOCUMENTS ===
      const docFiles: { title: string; url: string; type: string }[] = []
      let passportUrl: string | null = null
      try {
        const allFiles = fs.readdirSync(productDir)
        const pdfFiles = allFiles.filter(f => f.toLowerCase().endsWith('.pdf'))

        if (pdfFiles.length > 0) {
          const productDocDir = path.join(publicDir, slugify(sku))
          if (!fs.existsSync(productDocDir)) fs.mkdirSync(productDocDir, { recursive: true })

          for (const pdf of pdfFiles) {
            const srcPath = path.join(productDir, pdf)
            const destName = pdf.toLowerCase().replace(/\s+/g, '_')
            const destPath = path.join(productDocDir, destName)
            try {
              fs.copyFileSync(srcPath, destPath)
              const url = `/products/${slugify(sku)}/${destName}`

              // Determine document type from filename
              const nameLower = pdf.toLowerCase()
              let docType = 'document'
              let title = pdf.replace('.pdf', '')
              if (nameLower.includes('паспорт') || nameLower.includes('passport')) { docType = 'passport'; title = 'Паспорт' }
              else if (nameLower.includes('сертификат') || nameLower.includes('certificate')) { docType = 'certificate'; title = 'Сертификат' }
              else if (nameLower.includes('инструкция') || nameLower.includes('instruction') || nameLower.includes('manual')) { docType = 'instruction'; title = 'Инструкция' }
              else if (nameLower.includes('даташит') || nameLower.includes('datasheet')) { docType = 'datasheet'; title = 'Даташит' }

              docFiles.push({ title, url, type: docType })
              if (!passportUrl) passportUrl = url
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }

      // Remote images as fallback
      if (imageUrls.length === 0 && product.remoteImages.length > 0) {
        for (const url of product.remoteImages.slice(0, 6)) {
          imageUrls.push(url)
        }
      }

      // === UPSERT PRODUCT ===
      const productSlug = slugify(cleanName)
      let existingProduct = await prisma.product.findFirst({ where: { sku } })
      if (!existingProduct) {
        existingProduct = await prisma.product.findUnique({ where: { slug: productSlug } })
      }

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: cleanName,
            sku,
            brandId,
            categoryId,
            description: product.description || existingProduct.description,
            passport: passportUrl || existingProduct.passport,
          },
        })

        if (product.price > 0) {
          await prisma.productPrice.upsert({
            where: { productId: existingProduct.id },
            create: { productId: existingProduct.id, priceRetail: product.price, source: 'folder-import' },
            update: { priceRetail: product.price, source: 'folder-import' },
          })
        }

        if (product.specs.length > 0) {
          await prisma.productAttribute.deleteMany({ where: { productId: existingProduct.id } })
          await prisma.productAttribute.createMany({
            data: product.specs.map((s, i) => ({
              productId: existingProduct!.id, name: s.name, value: s.value, sortOrder: i,
            })),
          })
        }

        if (imageUrls.length > 0) {
          await prisma.productImage.deleteMany({ where: { productId: existingProduct.id } })
          await prisma.productImage.createMany({
            data: imageUrls.map((url, i) => ({
              productId: existingProduct!.id, url, alt: cleanName, isMain: i === 0, sortOrder: i,
            })),
          })
        }

        if (docFiles.length > 0) {
          await prisma.productDocument.deleteMany({ where: { productId: existingProduct.id } })
          await prisma.productDocument.createMany({
            data: docFiles.map((d, i) => ({
              productId: existingProduct!.id, title: d.title, url: d.url, type: d.type, sortOrder: i,
            })),
          })
        }

        updated++
      } else {
        let finalSlug = productSlug
        const slugExists = await prisma.product.findUnique({ where: { slug: finalSlug } })
        if (slugExists) finalSlug = `${productSlug}-${Date.now()}`

        await prisma.product.create({
          data: {
            name: cleanName,
            slug: finalSlug,
            sku,
            brandId,
            categoryId,
            description: product.description || null,
            passport: passportUrl || null,
            isActive: true,
            images: imageUrls.length > 0 ? {
              create: imageUrls.map((url, i) => ({ url, alt: cleanName, isMain: i === 0, sortOrder: i })),
            } : undefined,
            attributes: product.specs.length > 0 ? {
              create: product.specs.map((s, i) => ({ name: s.name, value: s.value, sortOrder: i })),
            } : undefined,
            documents: docFiles.length > 0 ? {
              create: docFiles.map((d, i) => ({ title: d.title, url: d.url, type: d.type, sortOrder: i })),
            } : undefined,
            prices: product.price > 0 ? {
              create: { priceRetail: product.price, source: 'folder-import' },
            } : undefined,
          },
        })

        imported++
      }
    } catch (e: any) {
      errors++
      errorList.push(`${path.basename(path.dirname(xmlPath))}: ${e.message?.slice(0, 100)}`)
    }
  }

  await prisma.importLog.update({
    where: { id: log.id },
    data: {
      status: 'COMPLETED',
      imported, updated, errors,
      errorLog: errorList.length > 0 ? errorList.slice(0, 50).join('\n') : undefined,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'import.folder',
      entity: 'ImportLog',
      entityId: log.id,
      details: `${path.basename(basePath)}: +${imported} / ↻${updated} / ✗${errors} / ⊘${skipped}`,
    },
  })

  return ok({
    total: productFiles.length,
    imported, updated, errors, skipped,
    errorList: errorList.slice(0, 20),
    categories: [...categoryCache.keys()],
    brands: [...brandCache.keys()],
  })
}
