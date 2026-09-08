import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Created lazily: this module is imported during SSR, where `window` does not
// exist. Cached so getSnapshot does not build a new MediaQueryList per render.
let mediaQuery: MediaQueryList | null = null
function getMediaQuery() {
  if (!mediaQuery) {
    mediaQuery = window.matchMedia(MOBILE_QUERY)
  }
  return mediaQuery
}

function subscribe(onStoreChange: () => void) {
  const mql = getMediaQuery()
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot() {
  return getMediaQuery().matches
}

// The server has no viewport. The previous implementation started as
// `undefined` and coerced to `false`, so it also rendered the desktop layout
// first; returning false here keeps that behaviour and keeps hydration stable.
function getServerSnapshot() {
  return false
}

/**
 * Subscribes to the mobile breakpoint.
 *
 * useSyncExternalStore rather than useEffect + setState: the viewport is
 * external state that React should read, not state React owns and then
 * synchronises after paint.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
