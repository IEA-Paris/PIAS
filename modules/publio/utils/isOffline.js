// Single source of truth for the "offline" development mode.
//
// When `OFFLINE=true` (set by `yarn dev`, see package.json), Publio skips every
// operation that reaches the network or spawns a headless browser:
//   - Zenodo API calls (record listing, upserts, publishing)
//   - DOI minting/fetching
//   - PDF generation (Puppeteer)
//   - Thumbnail + SVG generation (Puppeteer + sharp)
//
// This keeps `yarn dev` fast and fully local. Production paths (`yarn build`,
// `yarn generate`) don't set the flag, so their behaviour is unchanged.
export default function isOffline() {
  return process.env.OFFLINE === 'true'
}
