const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

/**
 * Prunes unnecessary fields from the Nuxt Content database JSON file
 * to reduce the file size for client-side downloads
 */
function pruneContentDatabase(distPath) {
  const contentDir = path.join(distPath, '_nuxt/content')

  // Check if content directory exists
  if (!fs.existsSync(contentDir)) {
    console.log(
      chalk.yellow(
        'Warning: Content directory not found at',
        contentDir,
        '- skipping pruning'
      )
    )
    return
  }

  // Find the database file (it may have a hash in the name like db-fb917fa8.json)
  const files = fs.readdirSync(contentDir)
  const dbFile = files.find(
    (file) => file.startsWith('db-') && file.endsWith('.json')
  )

  if (!dbFile) {
    console.log(
      chalk.yellow(
        'Warning: Content database file not found in',
        contentDir,
        '- skipping pruning'
      )
    )
    return
  }

  const dbPath = path.join(contentDir, dbFile)
  console.log(chalk.blue(`Pruning content database: ${dbFile}...`))

  // Read the database file
  const dbContent = fs.readFileSync(dbPath, 'utf8')
  const db = JSON.parse(dbContent)

  // Check if the expected structure exists
  if (!db._collections || !db._collections[0] || !db._collections[0]._data) {
    console.log(
      chalk.yellow('Warning: Unexpected database structure - skipping pruning')
    )
    return
  }

  const originalSize = Buffer.byteLength(dbContent, 'utf8')
  let prunedCount = 0

  // Define which fields to keep for each content type
  const fieldsToKeep = {
    articles: [
      'published',
      '$loki',
      'abstract',
      'article_slug',
      'article_title',
      'authors',
      'caption',
      'date',
      'dir',
      'extension',
      'highlight',
      'id',
      'image',
      'images',
      'index',
      'issue',
      'issueIndex',
      'language',
      'meta',
      'path',
      'picture',
      'slug',
      'title',
      'toCite',
      'years',
      'yt',
    ],
    issues: [
      'slug',
      'title',
      'date',
      'name_of_the_issue',
      'dir',
      'path',
      'extension',
      'meta',
      '$loki',
    ],
    authors: [
      '$loki',
      'articles',
      'date',
      'extension',
      'firstname',
      'is_institution',
      'id',
      'dir',
      'images',
      'index',
      'issue',
      'language',
      'lastname',
      'meta',
      'path',
      'picture',
      'slug',
      'social_channels',
      'years',
    ],
    media: [
      'abstract',
      '$loki',
      'article_slug',
      'article_title',
      'authors',
      'caption',
      'date',
      'dir',
      'extension',
      'highlight',
      'id',
      'images',
      'index',
      'issue',
      'issueIndex',
      'language',
      'meta',
      'path',
      'picture',
      'slug',
      'title',
      'years',
      'yt',
    ],
  }

  // Process each document in the database
  db._collections[0]._data = db._collections[0]._data.map((doc) => {
    if (!doc.dir) return doc

    let allowedFields = []

    // Determine content type based on dir value
    if (doc.dir.startsWith('/articles')) {
      allowedFields = fieldsToKeep.articles
    } else if (doc.dir.startsWith('/issues')) {
      allowedFields = fieldsToKeep.issues
    } else if (doc.dir.startsWith('/authors')) {
      allowedFields = fieldsToKeep.authors
    } else if (doc.dir.startsWith('/media')) {
      allowedFields = fieldsToKeep.media
    } else {
      // Unknown content type - keep as is
      return doc
    }

    // Create pruned document with only allowed fields
    const prunedDoc = {
      // Add required empty fields for Nuxt Content
      body: { type: 'root', children: [] },
      text: '',
    }
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(doc, field)) {
        prunedDoc[field] = doc[field]
      }
    })

    prunedCount++
    return prunedDoc
  })

  // Update the full text search index for the emptied text field
  if (
    db._collections &&
    db._collections[0] &&
    db._collections[0]._fullTextSearch &&
    db._collections[0]._fullTextSearch.ii &&
    db._collections[0]._fullTextSearch.ii.text &&
    db._collections[0]._fullTextSearch.ii.text.docStore
  ) {
    const textDocStore = db._collections[0]._fullTextSearch.ii.text.docStore
    // docStore is an array where each item has a fieldLength at index [1].fieldLength
    // Set fieldLength to 0 for all documents since we've emptied the text field
    if (Array.isArray(textDocStore)) {
      textDocStore.forEach((doc) => {
        if (doc && doc[1] && typeof doc[1].fieldLength !== 'undefined') {
          doc[1].fieldLength = 0
        }
      })
      console.log(
        chalk.blue('  Updated full text search index for emptied text fields')
      )
    }
  }

  // Write the pruned database back to file
  const prunedContent = JSON.stringify(db)
  fs.writeFileSync(dbPath, prunedContent, 'utf8')

  const prunedSize = Buffer.byteLength(prunedContent, 'utf8')
  const savedBytes = originalSize - prunedSize
  const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(2)

  console.log(
    chalk.green(
      `✓ Content database pruned successfully: ${prunedCount} documents processed`
    )
  )
  console.log(
    chalk.green(
      `  Original size: ${(originalSize / 1024).toFixed(
        2
      )} KB → Pruned size: ${(prunedSize / 1024).toFixed(2)} KB`
    )
  )
  console.log(
    chalk.green(
      `  Saved ${(savedBytes / 1024).toFixed(
        2
      )} KB (${savedPercentage}% reduction)`
    )
  )
}

module.exports = pruneContentDatabase
