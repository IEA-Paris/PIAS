// Copy text to the clipboard, working in both secure and insecure contexts.
//
// The async Clipboard API (navigator.clipboard) is only available in secure
// contexts (HTTPS / localhost). On plain-HTTP dev servers, inside some
// embeds, and in older browsers it is undefined or rejects — which is why the
// citation/quote copy buttons silently did nothing. We fall back to a hidden
// <textarea> + document.execCommand('copy') in those cases.
//
// Returns true on success, false otherwise.
export async function writeClipboard(text) {
  const value = (text || '').toString()
  if (!value) return false

  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch (e) {
    // fall through to the legacy path
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    // Keep it in the viewport (some browsers refuse to copy from an
    // off-screen / display:none element) but visually hidden.
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.width = '1px'
    ta.style.height = '1px'
    ta.style.padding = '0'
    ta.style.border = 'none'
    ta.style.outline = 'none'
    ta.style.boxShadow = 'none'
    ta.style.background = 'transparent'
    ta.style.opacity = '0'

    // When invoked from inside a Vuetify dialog/menu, the overlay traps focus
    // and pulls it back from a textarea appended to <body>, so the selection
    // is lost and execCommand copies nothing. Append inside the topmost open
    // overlay instead, so the textarea lives within the focus-trapped subtree.
    const overlays = document.querySelectorAll(
      '.v-dialog--active, .v-overlay--active, .v-menu__content--active'
    )
    const host = overlays.length ? overlays[overlays.length - 1] : document.body

    // Preserve and restore whatever was focused so the dialog isn't disturbed.
    const previouslyFocused = document.activeElement

    host.appendChild(ta)
    ta.focus({ preventScroll: true })
    ta.select()
    ta.setSelectionRange(0, value.length)
    const ok = document.execCommand('copy')
    host.removeChild(ta)

    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus({ preventScroll: true })
    }
    return ok
  } catch (e) {
    return false
  }
}

// Strip HTML tags and decode the handful of entities citation-js emits, so a
// rendered (HTML) citation becomes clean plain text for the clipboard.
export function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#38;/g, '&')
    .replace(/&amp;/g, '&')
    .trim()
}
