import { MODEL_LABELS } from './modelLabels'

export const WORD_POOL = [...MODEL_LABELS]

export function normalizeWord(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSimplePluralMatch(a, b) {
  if (!a || !b) return false
  if (a === `${b}s` || b === `${a}s`) return true
  if (a.endsWith('es') && a.slice(0, -2) === b) return true
  if (b.endsWith('es') && b.slice(0, -2) === a) return true
  return false
}

function isMultiWordAliasMatch(normalizedGuess, normalizedWord) {
  if (!normalizedGuess || !normalizedWord) return false
  const guessWords = normalizedGuess.split(' ')
  const targetWords = normalizedWord.split(' ')
  if (guessWords.length < targetWords.length) return false
  return targetWords.every((part) => guessWords.includes(part))
}

export function findMatchingWordFromCandidates(rawGuess, candidates = WORD_POOL) {
  const normalizedGuess = normalizeWord(rawGuess)
  if (!normalizedGuess) return null

  for (const word of candidates) {
    const normalizedWord = normalizeWord(word)
    if (!normalizedWord) continue

    if (normalizedGuess === normalizedWord) return word
    if (isSimplePluralMatch(normalizedGuess, normalizedWord)) return word
    if (isMultiWordAliasMatch(normalizedGuess, normalizedWord)) return word
  }

  return null
}

export function getRandomWordsFromPool() {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}
