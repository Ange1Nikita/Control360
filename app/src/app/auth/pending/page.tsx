'use client'

import { motion } from 'framer-motion'
import { Clock, Phone } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold">Аккаунт на проверке</h1>
        <p className="text-neutral-500 mt-3 leading-relaxed">
          Ваша заявка на регистрацию находится на рассмотрении. Администратор проверит данные и активирует ваш аккаунт. Обычно это занимает до 1 рабочего дня.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Phone size={14} />
          Вопросы: <a href="tel:+79189751642" className="text-blue-600 font-medium">+7 (918) 975-16-42</a>
        </div>
      </motion.div>
    </div>
  )
}
