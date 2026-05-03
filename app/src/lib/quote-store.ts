'use client'

import { useSyncExternalStore, useCallback } from 'react'

export interface QuoteStoreItem {
  productId: string
  name: string
  sku: string
  image: string
  price: number
  quantity: number
}

const STORAGE_KEY = 'vg-quote'
const EVENT_NAME = 'quote-updated'

function getItems(): QuoteStoreItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveItems(items: QuoteStoreItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function addToQuote(item: Omit<QuoteStoreItem, 'quantity'>) {
  const items = getItems()
  const existing = items.find(i => i.productId === item.productId)
  if (existing) {
    existing.quantity++
  } else {
    items.push({ ...item, quantity: 1 })
  }
  saveItems(items)
}

export function removeFromQuote(productId: string) {
  saveItems(getItems().filter(i => i.productId !== productId))
}

export function updateQuantity(productId: string, quantity: number) {
  const items = getItems()
  const item = items.find(i => i.productId === productId)
  if (item) {
    item.quantity = Math.max(1, quantity)
    saveItems(items)
  }
}

export function clearQuote() {
  saveItems([])
}

export function isInQuote(productId: string): boolean {
  return getItems().some(i => i.productId === productId)
}

// External store for useSyncExternalStore
const emptyItems: QuoteStoreItem[] = []
let snapshot = emptyItems
let hydrated = false

function subscribe(cb: () => void) {
  if (!hydrated) {
    snapshot = getItems()
    hydrated = true
  }
  const handler = () => { snapshot = getItems(); cb() }
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  // Trigger initial sync after hydration
  queueMicrotask(cb)
  return () => { window.removeEventListener(EVENT_NAME, handler); window.removeEventListener('storage', handler) }
}

function getSnapshot() { return snapshot }
function getServerSnapshot() { return emptyItems }

export function useQuoteStore() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  return { items, count, total }
}
