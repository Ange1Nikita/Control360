import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, unauthorized, forbidden } from '@/lib/api-response'
import { slugify } from '@/lib/utils'

export async function POST(req: NextRequest) {
  // Auth check disabled
const body = await req.json()
  const { products, source } = body

  if (!products || !Array.isArray(products)) {
    return err('Массив products обязателен')
  }

  // Create import log
  const importLog = await prisma.importLog.create({
    data: {
      type: 'PRODUCTS_XML',
      status: 'PROCESSING',
      filename: source || 'api-import',
      totalRows: products.length,
    },
  })

  let imported = 0
  let updated = 0
  let errors = 0

  for (const item of products) {
    try {
      const { name, sku, model, description, brand, category, attributes, images, prices } = item

      if (!name) { errors++; continue }

      const slug = slugify(sku || model || name)

      // Find or create brand
      let brandId: string | null = null
      if (brand) {
        const brandSlug = slugify(brand)
        const existing = await prisma.brand.findUnique({ where: { slug: brandSlug } })
        if (existing) {
          brandId = existing.id
        } else {
          const created = await prisma.brand.create({ data: { name: brand, slug: brandSlug } })
          brandId = created.id
        }
      }

      // Find or create category
      let categoryId: string | null = null
      if (category) {
        const catSlug = slugify(category)
        const existing = await prisma.category.findUnique({ where: { slug: catSlug } })
        if (existing) {
          categoryId = existing.id
        } else {
          const created = await prisma.category.create({ data: { name: category, slug: catSlug } })
          categoryId = created.id
        }
      }

      // Upsert product — match by SKU first, then slug
      let existingProduct = sku ? await prisma.product.findFirst({ where: { sku } }) : null
      if (!existingProduct) {
        existingProduct = await prisma.product.findUnique({ where: { slug } })
      }

      if (existingProduct) {
        // Update
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: name || existingProduct.name,
            description: description || existingProduct.description,
            brandId: brandId || existingProduct.brandId,
            categoryId: categoryId || existingProduct.categoryId,
            model: model || existingProduct.model,
          },
        })

        // Update prices if provided
        if (prices) {
          await prisma.productPrice.upsert({
            where: { productId: existingProduct.id },
            update: {
              rrp: prices.rrp || undefined,
              priceDealer: prices.priceDealer || undefined,
              priceCash: prices.priceCash || undefined,
              priceRetail: prices.priceRetail || undefined,
            },
            create: {
              productId: existingProduct.id,
              ...prices,
            },
          })
        }

        updated++
      } else {
        // Create
        const product = await prisma.product.create({
          data: {
            name,
            slug,
            sku: sku || null,
            model: model || null,
            description: description || null,
            brandId,
            categoryId,
          },
        })

        // Create attributes
        if (attributes && Array.isArray(attributes)) {
          await prisma.productAttribute.createMany({
            data: attributes.map((a: { name: string; value: string }, i: number) => ({
              productId: product.id,
              name: a.name,
              value: a.value,
              sortOrder: i,
            })),
          })
        }

        // Create images
        if (images && Array.isArray(images)) {
          await prisma.productImage.createMany({
            data: images.map((url: string, i: number) => ({
              productId: product.id,
              url,
              isMain: i === 0,
              sortOrder: i,
            })),
          })
        }

        // Create prices
        if (prices) {
          await prisma.productPrice.create({
            data: { productId: product.id, ...prices },
          })
        }

        imported++
      }
    } catch (e) {
      errors++
    }
  }

  // Update import log
  await prisma.importLog.update({
    where: { id: importLog.id },
    data: {
      status: 'COMPLETED',
      imported,
      updated,
      errors,
      completedAt: new Date(),
    },
  })

  // Audit
  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'import.products',
      details: { source, imported, updated, errors, total: products.length },
    },
  })

  return ok({ imported, updated, errors, total: products.length })
}
