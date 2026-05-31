import {
  canonicalInstitutionKey,
  pruneEmptyPositions,
  mergeAffiliations,
  normalizeAuthor,
  _combinedInstitutions,
} from '../modules/publio/utils/contentUtilities'

describe('canonicalInstitutionKey', () => {
  it('folds case, accents and punctuation only (no translation)', () => {
    expect(canonicalInstitutionKey('ETH Zurich')).toBe('eth-zurich')
    expect(canonicalInstitutionKey('eth  ZURICH')).toBe('eth-zurich')
    // slugify strips ã (not in its map) -> "so"; connectors are NOT dropped
    expect(canonicalInstitutionKey('Université de São Paulo')).toBe(
      'universite-de-so-paulo'
    )
  })
  it('does NOT fold across languages — FR/EN stay distinct', () => {
    expect(canonicalInstitutionKey('Université de São Paulo, Brésil')).not.toBe(
      canonicalInstitutionKey('University of São Paulo')
    )
  })
  it('returns empty for falsy', () => {
    expect(canonicalInstitutionKey('')).toBe('')
    expect(canonicalInstitutionKey(null)).toBe('')
  })
})

describe('pruneEmptyPositions', () => {
  it("drops '' and whitespace, keeps real positions", () => {
    expect(pruneEmptyPositions(['', '  ', 'Director'])).toEqual(['Director'])
    expect(pruneEmptyPositions(null)).toEqual([])
  })
})

describe('mergeAffiliations', () => {
  it('coexists genuinely distinct institutions (no false conflict)', () => {
    const res = mergeAffiliations(
      [{ institution: 'London School of Economics, United Kingdom', positions: [] }],
      [{ institution: 'Paris Institute for Advanced Study, France', positions: [] }]
    )
    expect(res).toHaveLength(2)
  })

  it('drops a bare same-language spelling covered by a more specific one', () => {
    const res = mergeAffiliations(
      [{ institution: 'ETH Zurich', positions: [] }],
      [{ institution: 'ETH Zurich, Switzerland', positions: [] }]
    )
    // both empty, same language → keep the more specific spelling only
    expect(res).toHaveLength(1)
    expect(res[0].institution).toBe('ETH Zurich, Switzerland')
  })

  it('keeps a positioned variant when the more specific one has no positions', () => {
    // "London School of Economics" [Professor] must NOT be dropped for the bare
    // "London School of Economics, United Kingdom" [] — that would lose Professor.
    const res = mergeAffiliations(
      [{ institution: 'London School of Economics', positions: ['Professor'] }],
      [
        {
          institution: 'London School of Economics, United Kingdom',
          positions: [],
        },
      ]
    )
    const lse = res.find((r) => r.positions.includes('Professor'))
    expect(lse).toBeTruthy()
    expect(lse.positions).toEqual(['Professor'])
  })

  it('prefers the position-bearing spelling among prefix-related duplicates', () => {
    // The Lahlou Paris-IAS case: bare + ",France" both carry [Director].
    const res = mergeAffiliations(
      [
        {
          institution: 'Paris Institute for Advanced Study',
          positions: ['Director'],
        },
        {
          institution: 'Paris Institute for Advanced Study, France',
          positions: ['Director'],
        },
      ],
      []
    )
    expect(res).toHaveLength(1)
    expect(res[0].institution).toBe('Paris Institute for Advanced Study, France')
    expect(res[0].positions).toEqual(['Director'])
  })

  it('dedupes a true duplicate (same institution + positions, casing differs)', () => {
    const res = mergeAffiliations(
      [{ institution: 'World Bank', positions: ['Economist'] }],
      [{ institution: 'WORLD BANK', positions: ['Economist'] }]
    )
    expect(res).toHaveLength(1)
    expect(res[0].positions).toEqual(['Economist'])
  })

  it('drops an empty-position duplicate of a positioned entry (same key)', () => {
    const res = mergeAffiliations(
      [{ institution: 'World Bank', positions: ['Economist'] }],
      [{ institution: 'World Bank', positions: [''] }]
    )
    // The empty-position "World Bank" is redundant against the positioned one
    // and is dropped — no duplicate, and "Economist" is NOT removed.
    expect(res).toHaveLength(1)
    expect(res[0].positions).toEqual(['Economist'])
  })

  it('NEVER pools positions across entries (no fabricated pairs)', () => {
    // The Lahlou bug: "Director" must not leak onto LSE.
    const res = mergeAffiliations(
      [
        {
          institution: 'London School of Economics, United Kingdom',
          positions: ['Professor'],
        },
        {
          institution: 'Paris Institute for Advanced Study, France',
          positions: ['Director'],
        },
      ],
      []
    )
    const lse = res.find((r) => /London School/.test(r.institution))
    expect(lse.positions).toEqual(['Professor'])
    expect(lse.positions).not.toContain('Director')
  })

  it('keeps FR/PT/EN spellings as distinct entries (no translation merge)', () => {
    const res = mergeAffiliations(
      [
        { institution: 'Université de São Paulo, Brésil', positions: [] },
        { institution: 'Universidade de São Paulo', positions: [] },
      ],
      [{ institution: 'University of São Paulo', positions: [] }]
    )
    expect(res).toHaveLength(3)
  })

  it('flags a combined "A / B" institution without splitting it', () => {
    mergeAffiliations(
      [{ institution: 'Inst A, France / College B, UK', positions: [] }],
      [],
      { firstname: 'X', lastname: 'Y' }
    )
    const flagged = _combinedInstitutions.find((c) =>
      /Inst A, France \/ College B, UK/.test(c.institution)
    )
    expect(flagged).toBeTruthy()
  })
})

describe('normalizeAuthor', () => {
  it('trims names and drops empty-institution affiliations', () => {
    const a = normalizeAuthor({
      firstname: 'Saadi ',
      lastname: ' Lahlou',
      positions_and_institutions: [
        { institution: '  ', positions: [''] },
        { institution: 'IEA de Paris, France', positions: ['', 'Director'] },
      ],
    })
    expect(a.firstname).toBe('Saadi')
    expect(a.lastname).toBe('Lahlou')
    expect(a.positions_and_institutions).toEqual([
      { institution: 'IEA de Paris, France', positions: ['Director'] },
    ])
  })
})
