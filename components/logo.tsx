import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * The SmokeFree lockup: mark plus wordmark.
 *
 * The mark ships as two fixed-colour rasters rather than one themeable asset —
 * dark ink for light backgrounds, cream for dark ones — so CSS swaps them
 * rather than trying to recolour a PNG. Both files are trimmed to their
 * artwork, which is what keeps them the same optical size across the swap:
 * padding baked into one and not the other would make the logo visibly resize
 * when the theme changed.
 *
 * The wordmark stays as live text rather than using the raster lockup. It
 * inherits `text-primary`, so it themes for free, stays selectable and
 * searchable, and never ships a second copy of the logo's pixels.
 *
 * `alt=""` on both images is deliberate: the wordmark beside them already
 * carries the name, so labelling the mark too would make a screen reader
 * announce "SmokeFree" twice.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo-mark-green.png"
        alt=""
        width={254}
        height={363}
        priority
        className="h-5 w-auto dark:hidden"
      />
      <Image
        src="/logo-mark-cream.png"
        alt=""
        width={491}
        height={690}
        priority
        className="hidden h-5 w-auto dark:block"
      />
      <span className="text-base font-semibold tracking-tight">
        Smoke<span className="text-primary">Free</span>
      </span>
    </span>
  )
}
