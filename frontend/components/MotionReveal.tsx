'use client'

import React, { useEffect, useRef, useState } from 'react'

interface MotionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number // in ms
  direction?: 'up' | 'down' | 'none'
  threshold?: number
}

export function MotionReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.12,
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Fallback if IntersectionObserver isn't supported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const getTransformClasses = () => {
    if (isVisible) return 'opacity-100 translate-y-0 scale-100'

    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-7 scale-[0.99]'
      case 'down':
        return 'opacity-0 -translate-y-7 scale-[0.99]'
      case 'none':
      default:
        return 'opacity-0 scale-[0.98]'
    }
  }

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  )
}
