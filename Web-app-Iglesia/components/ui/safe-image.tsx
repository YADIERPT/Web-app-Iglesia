'use client'

import { useState } from 'react'
import { Church, Landmark, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string
  fallbackCategory?: 'church' | 'patrimonio' | 'santo' | 'default'
  containerClassName?: string
  aspectRatioClass?: string
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackText,
  fallbackCategory = 'default',
  containerClassName,
  aspectRatioClass = 'aspect-[4/3]',
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const CategoryIcon =
    fallbackCategory === 'church'
      ? Church
      : fallbackCategory === 'santo'
        ? Sparkles
        : Landmark

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden bg-secondary/70 p-6 text-muted-foreground select-none',
          aspectRatioClass,
          containerClassName
        )}
        aria-label={alt || 'Imagen no disponible'}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background/80 shadow-xs">
          <CategoryIcon className="size-6 text-primary/80" aria-hidden />
        </div>
        {fallbackText && (
          <span className="mt-3 max-w-[85%] text-center font-serif text-sm font-medium tracking-wide text-foreground/80 line-clamp-1">
            {fallbackText}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-secondary/50', aspectRatioClass, containerClassName)}>
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          'size-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
      {!loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/40 animate-pulse" aria-hidden>
          <div className="size-8 rounded-full border border-border/40" />
        </div>
      )}
    </div>
  )
}
