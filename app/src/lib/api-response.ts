import { NextResponse } from 'next/server'

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function unauthorized(message = 'Не авторизован') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Нет доступа') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFound(message = 'Не найдено') {
  return NextResponse.json({ error: message }, { status: 404 })
}
