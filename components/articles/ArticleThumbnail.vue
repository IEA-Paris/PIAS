<template>
  <Item v-bind="$attrs">
    <!--     <template v-if="hasContent('categories')" #categories>
      <slot name="categories"></slot>
    </template> -->
    <template v-if="hasContent('caption')" #caption>
      <slot name="caption"></slot>
    </template>
    <template v-if="hasContent('author')" #author>
      <slot name="author"></slot>
    </template>
    <template v-if="hasContent('date')" #date>
      <slot name="date"></slot>
    </template>
    <template #content>
      <!--
        Prefer the inline vector fingerprint: fetching the SVG and embedding it
        lets us animate its individual <line>/<circle> elements with pure CSS
        (no per-frame JS), which an <img src> could never expose. The PNG stays
        as the fallback while the SVG loads or if the fetch fails.
      -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="svgMarkup"
        ref="fingerprint"
        class="fingerprint-animated"
        :class="{ 'is-hovered': hovered, 'is-entered': entered }"
        v-html="svgMarkup"
      ></div>
      <!-- eslint-enable vue/no-v-html -->
      <img
        v-else
        v-bind="$attrs"
        :src="'/thumbnails/' + item.slug + '.png'"
        :alt="item.article_title || 'Article thumbnail'"
        style="max-height: 100%; max-width: 100%"
        @error="handleImageError"
      />
    </template>
  </Item>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    size: {
      type: [String, Number],
      default: '200px',
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      svgMarkup: '',
      hovered: false,
      hoverTarget: null,
      entered: false,
      enterTimer: null,
    }
  },
  mounted() {
    this.loadSvg()
    this.bindHover()
    this.scheduleEntry()
  },
  beforeDestroy() {
    if (this.enterTimer) clearTimeout(this.enterTimer)
    if (this.hoverTarget) {
      this.hoverTarget.removeEventListener('mouseenter', this.onEnter)
      this.hoverTarget.removeEventListener('mouseleave', this.onLeave)
    }
  },
  methods: {
    // The Item overlay (z-index: 2) sits on top of the fingerprint and would
    // swallow a CSS `:hover` on the SVG wrapper. Instead we drive a `hovered`
    // flag from the enclosing card frame, which always contains the cursor.
    bindHover() {
      const target = this.$el.closest('.frame') || this.$el
      this.hoverTarget = target
      target.addEventListener('mouseenter', this.onEnter)
      target.addEventListener('mouseleave', this.onLeave)
    },
    // Stagger the load animation down the list: each item reveals 200ms after
    // the one above it. We gate the animation on a JS-added `is-entered` class
    // rather than a CSS `animation-delay`, because each SVG is injected
    // whenever its own fetch resolves — a per-element CSS delay would count
    // from that scattered injection moment and the cascade wouldn't be
    // perceptible. The timer counts from a shared mount instead.
    scheduleEntry() {
      this.enterTimer = setTimeout(() => {
        this.entered = true
      }, this.index * 200)
    },
    onEnter() {
      this.hovered = true
    },
    onLeave() {
      this.hovered = false
    },
    hasContent(slot) {
      return !!this.$slots[slot]
    },
    // Heuristic: skip the inline animated SVG on weak devices / constrained
    // connections and keep the cheap static PNG instead. This avoids both the
    // extra network round-trip and the cost of animating dozens of vector
    // nodes on hardware that would render it as jank.
    isLowEndDevice() {
      if (typeof navigator === 'undefined') return false
      // Honour the OS "reduce motion" accessibility setting: serve the still
      // PNG rather than spend work assembling an SVG we won't animate anyway.
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return true
      }
      // Honour Data Saver / very slow connections.
      const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection
      if (conn) {
        if (conn.saveData) return true
        if (/(^|-)2g$/.test(conn.effectiveType || '')) return true
      }
      // Very few CPU cores is a strong signal of a low-power device. Kept
      // conservative (<= 2) so capable mid-range phones/laptops still animate.
      if (
        typeof navigator.hardwareConcurrency === 'number' &&
        navigator.hardwareConcurrency <= 2
      ) {
        return true
      }
      // Low memory (Chromium-only; absent elsewhere, so this never false-positives).
      if (
        typeof navigator.deviceMemory === 'number' &&
        navigator.deviceMemory <= 2
      ) {
        return true
      }
      return false
    },
    async loadSvg() {
      if (!this.item || !this.item.slug) return
      if (this.isLowEndDevice()) return // keep the PNG fallback for smooth UX
      try {
        const res = await fetch('/svg/' + this.item.slug + '.svg')
        if (!res.ok) return // silently keep the PNG fallback
        const text = await res.text()
        // Guard against an HTML 404 page being returned as 200 by some hosts.
        if (!text.includes('<svg')) return
        this.svgMarkup = this.makeResponsive(text)
      } catch (e) {
        // Network/offline: fall back to the PNG, no need to surface this.
      }
    },
    // The generated SVG carries a fixed viewBox but no width/height, so it can
    // overflow its card. Strip the screenshot-only spin animation and let it
    // scale to the container instead.
    makeResponsive(svg) {
      return svg.replace(
        /<svg([^>]*)>/,
        '<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
      )
    },
    handleImageError(event) {
      // Log the error for debugging
      console.warn(
        'Failed to load thumbnail for:',
        this.item.slug,
        '/thumbnails/' + this.item.slug + '.png'
      )
      // Optionally set a fallback image
      // event.target.src = '/path/to/fallback.png'
    },
  },
}
</script>

<style lang="scss" scoped>
.fingerprint-animated {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
}

/* The injected SVG fills its container. */
.fingerprint-animated ::v-deep svg {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 100%;
  will-change: transform, filter;
  /* Idle state rests still — the load animation does the talking. A glow and
     gentle bloom are reserved for hover (transitioned for a smooth handoff). */
  transition: filter 0.6s ease, transform 0.6s ease;
}

/* ── Discrete load animation ─────────────────────────────────────────────
   Each spoke draws itself in once, then its outer node pops into place. The
   nth-of-type stagger sweeps the assembly around the dial. After that the
   fingerprint rests — no perpetual pulsing in the idle grid. */
/* The list-index stagger (200ms × index) is driven from JS: the wrapper gains
   `.is-entered` after a per-item timeout, and only then do the load animations
   run. Before that the elements sit in their pre-animation state (spokes
   undrawn, nodes/ring hidden) so nothing flashes into its final form early. */
.fingerprint-animated ::v-deep .type-element line {
  stroke-dasharray: 90;
  stroke-dashoffset: 90;
}

.fingerprint-animated ::v-deep .type-element circle:last-of-type {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}

.fingerprint-animated ::v-deep > svg > g > circle:first-child {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}

.fingerprint-animated.is-entered ::v-deep .type-element line {
  animation: fp-draw 1.4s ease-out forwards;
}

.fingerprint-animated.is-entered ::v-deep .type-element circle:last-of-type {
  animation: fp-pop 0.6s ease-out forwards;
}

/* The central base ring fades up underneath everything as the dial assembles. */
.fingerprint-animated.is-entered ::v-deep > svg > g > circle:first-child {
  opacity: 1;
  animation: fp-ring-in 1.2s ease-out;
}

/* Stagger the reveal across the first chunk of spokes for an assembling sweep.
   Beyond ~24 spokes everything is already in motion, so a flat delay is fine.
   The list-index offset is handled in JS (the `.is-entered` gate), so these
   are just the within-fingerprint spoke staggers. */
@for $i from 1 through 24 {
  .fingerprint-animated.is-entered
    ::v-deep
    .type-element:nth-of-type(#{$i})
    line {
    animation-delay: #{$i * 0.04}s;
  }
  .fingerprint-animated.is-entered
    ::v-deep
    .type-element:nth-of-type(#{$i})
    circle:last-of-type {
    animation-delay: #{$i * 0.04 + 0.2}s;
  }
}

/* ── Complex hover animation ─────────────────────────────────────────────
   On hover the fingerprint comes alive: the dial blooms slightly larger, a
   faint glow grows, every node breathes, and the radial spokes shimmer.
   Per-node delays are seeded off nth-of-type so the breathing ripples outward
   rather than throbbing in unison. No rotation — it keeps the vector crisp. */
.fingerprint-animated.is-hovered ::v-deep svg {
  transform: scale(1.04);
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.45));
}

.fingerprint-animated.is-hovered ::v-deep .type-element circle:last-of-type {
  animation: fp-pulse 2.4s ease-in-out infinite;
}

.fingerprint-animated.is-hovered ::v-deep .type-element line {
  animation: fp-shimmer 2.4s ease-in-out infinite;
}

.fingerprint-animated.is-hovered ::v-deep > svg > g > circle:first-child {
  animation: fp-ring-breathe 4s ease-in-out infinite;
}

/* Ripple the hover breathing/shimmer outward by spoke index. */
@for $i from 1 through 24 {
  .fingerprint-animated.is-hovered
    ::v-deep
    .type-element:nth-of-type(#{$i})
    circle:last-of-type,
  .fingerprint-animated.is-hovered
    ::v-deep
    .type-element:nth-of-type(#{$i})
    line {
    animation-delay: #{$i * 0.05}s;
  }
}

@keyframes fp-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fp-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fp-ring-in {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fp-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.35);
  }
}

@keyframes fp-shimmer {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

@keyframes fp-ring-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

/* Respect users who prefer no motion: show the assembled fingerprint, still,
   and drop the hover choreography. */
@media (prefers-reduced-motion: reduce) {
  .fingerprint-animated ::v-deep svg,
  .fingerprint-animated.is-hovered ::v-deep svg,
  .fingerprint-animated ::v-deep .type-element line,
  .fingerprint-animated.is-hovered ::v-deep .type-element line,
  .fingerprint-animated ::v-deep .type-element circle:last-of-type,
  .fingerprint-animated.is-hovered ::v-deep .type-element circle:last-of-type,
  .fingerprint-animated ::v-deep > svg > g > circle:first-child,
  .fingerprint-animated.is-hovered ::v-deep > svg > g > circle:first-child {
    animation: none;
  }
  .fingerprint-animated ::v-deep .type-element line {
    stroke-dashoffset: 0;
  }
  .fingerprint-animated ::v-deep .type-element circle:last-of-type {
    opacity: 1;
  }
  .fingerprint-animated ::v-deep > svg > g > circle:first-child {
    opacity: 1;
  }
  .fingerprint-animated.is-hovered ::v-deep svg {
    filter: none;
    transform: none;
  }
}
</style>
