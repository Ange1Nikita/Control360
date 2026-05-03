'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function ContactsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div {...fadeUp} className="text-center mb-12">
        <h1 className="text-3xl font-bold">Контакты</h1>
        <p className="text-neutral-500 mt-2">Свяжитесь с нами любым удобным способом</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="space-y-6">
          {[
            { icon: Phone, label: 'Телефон', value: '+7 (918) 975-16-42', href: 'tel:+79189751642' },
            { icon: Mail, label: 'Email', value: 'krasnodar@vidosgroup.ru', href: 'mailto:krasnodar@vidosgroup.ru' },
            { icon: MapPin, label: 'Адрес', value: 'г. Краснодар, ул. Боспорская, 10' },
            { icon: Clock, label: 'Режим работы', value: 'Ежедневно 8:00 — 22:00' },
          ].map((c, i) => (
            <motion.div key={i} variants={fadeUp}
              className="flex items-start gap-4 p-5 bg-white rounded-xl border border-neutral-200">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <c.icon size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-neutral-400 font-medium uppercase">{c.label}</div>
                {c.href ? (
                  <a href={c.href} className="text-sm font-semibold text-neutral-900 hover:text-blue-600 transition-colors">{c.value}</a>
                ) : (
                  <div className="text-sm font-semibold text-neutral-900">{c.value}</div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Map placeholder */}
        <motion.div {...fadeUp} className="bg-neutral-100 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=39.036659%2C45.075960&z=16&pt=39.036659%2C45.075960%2Cpm2rdm"
            width="100%" height="100%" frameBorder="0" allowFullScreen loading="lazy"
            className="rounded-xl min-h-[400px]"
          />
        </motion.div>
      </div>
    </div>
  )
}
