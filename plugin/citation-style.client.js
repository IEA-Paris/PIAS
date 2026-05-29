import lists from '~/assets/data/lists'

// Hydrate the reader's preferred citation style from localStorage on load.
// Runs client-only (localStorage is unavailable during SSR / nuxtServerInit).
// Persisted by the `setStyle` mutation (store/index.js).
export default ({ store }) => {
  try {
    const saved = localStorage.getItem('articles.style')
    // Only restore a value that is still a valid style, so a stale/invalid
    // entry can never break citation rendering.
    if (saved && lists.articles.styles.includes(saved)) {
      store.commit('setStyle', saved)
    }
  } catch (e) {
    // localStorage may be unavailable (private mode / blocked); ignore.
  }
}
