'use client'

import {
  useEffect,
  useState,
  useRef,
  createElement,
  ElementType,
  ReactNode,
  Fragment,
} from 'react'

interface TypedTextProps {
  /** Текст для печати. Поддерживает \n как перенос строки (рендерится <br />). */
  text: string
  /** Миллисекунды на один символ. */
  speed?: number
  /** Задержка перед стартом печати, мс. */
  startDelay?: number
  /** Если false — печать не стартует (удобно для каскада: ждать окончания предыдущего). */
  active?: boolean
  /** Показывать мигающий курсор во время печати. */
  showCursor?: boolean
  /** Оставить мигающий курсор на конце после окончания печати. */
  cursorOnDone?: boolean
  /** Колбэк по завершению печати. */
  onComplete?: () => void
  className?: string
  /** HTML-элемент, в который обернуть. По умолчанию <span>. */
  as?: ElementType
}

export default function TypedText({
  text,
  speed = 42,
  startDelay = 0,
  active = true,
  showCursor = true,
  cursorOnDone = false,
  onComplete,
  className,
  as = 'span',
}: TypedTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!active) return
    let cancelled = false
    let stepTimer: ReturnType<typeof setTimeout> | null = null

    const startTimer = setTimeout(() => {
      let i = 0
      const step = () => {
        if (cancelled) return
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1))
          i += 1
          stepTimer = setTimeout(step, speed)
        } else {
          setDone(true)
          onCompleteRef.current?.()
        }
      }
      step()
    }, startDelay)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      if (stepTimer) clearTimeout(stepTimer)
    }
  }, [text, speed, startDelay, active])

  // \n → <br />
  const lines = displayed.split('\n')
  const content: ReactNode[] = []
  lines.forEach((line, i) => {
    content.push(<Fragment key={`l${i}`}>{line}</Fragment>)
    if (i < lines.length - 1) content.push(<br key={`br${i}`} />)
  })

  const cursorVisible = !done ? (active && showCursor) : cursorOnDone

  return createElement(
    as,
    { className, 'aria-label': text },
    <>
      {content}
      {cursorVisible && <span className="typed-cursor" aria-hidden />}
    </>
  )
}
