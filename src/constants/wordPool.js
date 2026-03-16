export const SPECIAL_WORD = 'loudspeaker'

export const WORD_POOL = [
  // Animals
  'cat',
  'dog',
  'fish',
  'bird',
  'snake',
  'turtle',
  'rabbit',
  'elephant',
  'spider',
  'butterfly',
  'crab',
  'penguin',
  'frog',
  'whale',
  'bee',
  // Nature
  'sun',
  'moon',
  'star',
  'cloud',
  'rainbow',
  'lightning',
  'mountain',
  'flower',
  'tree',
  'leaf',
  'wave',
  'island',
  'river',
  'lake',
  'volcano',
  // Objects
  'house',
  'door',
  'window',
  'car',
  'boat',
  'rocket',
  'kite',
  'ladder',
  'bridge',
  'umbrella',
  'key',
  'hammer',
  'clock',
  'bell',
  'crown',
  // Food
  'pizza',
  'apple',
  'banana',
  'cake',
  'ice cream',
  'carrot',
  'cupcake',
  'lollipop',
  'cookie',
  'sandwich',
  // Shapes / Fun
  'heart',
  'spiral',
  'castle',
  'sword',
  'flag',
  'trophy',
  'diamond',
  'arrow',
  'smiley face',
  'snowflake'
]

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
  const poolWithoutSpecial = WORD_POOL.filter((w) => w !== SPECIAL_WORD)
  const shuffled = [...poolWithoutSpecial].sort(() => Math.random() - 0.5)
  const randomSelection = shuffled.slice(0, 4)
  return [SPECIAL_WORD, ...randomSelection].sort(() => Math.random() - 0.5)
}
