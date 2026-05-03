import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { ok, forbidden } from '@/lib/api-response'
import fs from 'fs'
import path from 'path'

// Папки/файлы которые НЕ являются папками брендов
const SKIP = new Set([
  'app', 'node_modules', '.git', '.next', 'images', '.vscode',
  '__pycache__', '.idea', 'dist', 'build',
])

const SKIP_FILES = new Set([
  'ARCHITECTURE.md', 'README.md', 'package.json', 'tsconfig.json',
  '.gitignore', '.env', 'Инструкция.txt',
])

export async function GET() {
  // Auth check disabled
// Корень проекта — папка выше app/
  const projectRoot = path.resolve(process.cwd(), '..')

  const folders: {
    name: string
    path: string
    hasOutput: boolean
    productCount: number
    categories: string[]
  }[] = []

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (SKIP.has(entry.name)) continue
      if (entry.name.startsWith('.')) continue

      const folderPath = path.join(projectRoot, entry.name)

      // Проверяем есть ли output/ с product.xml внутри
      const outputPath = path.join(folderPath, 'output')
      let hasOutput = false
      let productCount = 0
      const categories: string[] = []

      if (fs.existsSync(outputPath)) {
        hasOutput = true
        // Считаем product.xml рекурсивно и собираем категории
        const catSet = new Set<string>()
        countProducts(outputPath, catSet)
        productCount = countProductFiles(outputPath)
        categories.push(...catSet)
      }

      folders.push({
        name: entry.name,
        path: folderPath,
        hasOutput,
        productCount,
        categories,
      })
    }
  } catch {
    // Если не удалось прочитать — возвращаем пустой список
  }

  return ok({ folders, root: projectRoot })
}

function countProductFiles(dir: string): number {
  let count = 0
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += countProductFiles(path.join(dir, entry.name))
      } else if (entry.name === 'product.xml') {
        count++
      }
    }
  } catch { /* skip */ }
  return count
}

function countProducts(dir: string, categories: Set<string>, depth = 0) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Первый уровень после output — это категории
        if (depth === 0 && entry.name !== '__pycache__') {
          categories.add(entry.name)
        }
        countProducts(path.join(dir, entry.name), categories, depth + 1)
      }
    }
  } catch { /* skip */ }
}
