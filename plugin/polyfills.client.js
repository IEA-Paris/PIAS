/**
 * Polyfills for legacy browsers
 * Conditionally loads polyfills only when needed
 */

export default function () {
  // Check if IntersectionObserver is supported
  if (
    typeof window !== 'undefined' &&
    !('IntersectionObserver' in window) &&
    !('IntersectionObserverEntry' in window) &&
    !('intersectionRatio' in window.IntersectionObserverEntry.prototype)
  ) {
    // Load polyfill for legacy browsers
    import('intersection-observer')
  }
}
