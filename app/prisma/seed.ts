import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vidosgroup.ru' },
    update: {},
    create: {
      email: 'admin@vidosgroup.ru',
      passwordHash: bcrypt.hashSync('admin123', 12),
      name: 'Администратор',
      role: 'ADMIN',
      status: 'ACTIVE',
      company: 'VidosGroup Краснодар',
    },
  })
  console.log(`Admin: ${admin.email} / admin123`)

  const categories = [
    'IP-камеры','Аналоговые камеры','Регистраторы NVR','Регистраторы DVR',
    'Комплекты','Домофоны','Вызывные панели','СКУД',
    'Охранная сигнализация','Автоматика ворот','Коммутаторы',
    'Источники питания','Кабельная продукция','Кронштейны','Жёсткие диски',
  ]
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/[а-яёА-ЯЁ]/g, c => {
      const m: Record<string,string> = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ы':'y','э':'e','ю':'yu','я':'ya'}
      return m[c.toLowerCase()] || c
    }).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } })
  }
  console.log(`Categories: ${categories.length}`)

  const brands = ['Hikvision','HiWatch','Dahua','FOX','KENO','ViGUARD','iFLOW','Uniview','Tiandy','EZVIZ','IMOU','Accordtec','ZKTeco','DoorHan','CAME','BFT','Tantos','Slinex','Bolid']
  for (const name of brands) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    await prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug } })
  }
  console.log(`Brands: ${brands.length}`)

  console.log('\nГотово!')
  console.log('Вход: admin@vidosgroup.ru / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
