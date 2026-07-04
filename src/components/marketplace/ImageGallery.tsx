'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageT } from '@/lib/types'

export function ImageGallery({ images }: { images: ImageT[] }) {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const paginate = useCallback((d: number) => {
    setDir(d)
    setIndex((i) => (i + d + images.length) % images.length)
  }, [images.length])

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x < -threshold) paginate(1)
    else if (info.offset.x > threshold) paginate(-1)
  }

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-muted grid place-items-center border hairline rounded-sm">
        <span className="font-mono text-xs text-muted-foreground/50 uppercase tracking-wider">
          no image
        </span>
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-sm border hairline select-none">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: dir > 0 ? 60 : dir < 0 ? -60 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? -60 : 60 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={images[index].url}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/80 hover:bg-background border hairline rounded-full backdrop-blur-sm transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/80 hover:bg-background border hairline rounded-full backdrop-blur-sm transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-2 right-2 font-mono text-[11px] text-background bg-foreground/70 px-2 py-0.5 rounded-sm tnum">
              {index + 1} / {images.length}
            </div>
            <button
              onClick={() => setExpanded(true)}
              className="absolute top-2 right-2 size-8 grid place-items-center bg-background/80 hover:bg-background border hairline rounded-full backdrop-blur-sm transition-colors"
              aria-label="Expand"
            >
              <Expand className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setDir(i > index ? 1 : -1)
                setIndex(i)
              }}
              className={cn(
                'relative w-16 h-16 shrink-0 overflow-hidden rounded-sm border-2 transition-colors',
                i === index ? 'border-oxblood' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Expanded lightbox */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm grid place-items-center p-4"
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 size-10 grid place-items-center bg-foreground text-background rounded-full"
            >
              <X />
            </button>
            <motion.img
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[index].url}
              alt=""
              className="max-w-full max-h-full object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(-1) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-12 grid place-items-center bg-foreground text-background rounded-full"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(1) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-12 grid place-items-center bg-foreground text-background rounded-full"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
