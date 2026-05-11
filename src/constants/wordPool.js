import { MODEL_LABELS } from './modelLabels'
import { GENERATED_WORD_DIFFICULTY } from '../data/quickdrawGenerated'

export const WORD_POOL = [...MODEL_LABELS]
export const DIFFICULTY_LEVELS = ['very easy', 'easy', 'medium', 'hard', 'very hard']

const WORD_DIFFICULTY = {
  square: 'very easy',
  triangle: 'very easy',
  circle: 'very easy',
  door: 'very easy',
  cat: 'easy',
  dog: 'easy',
  fish: 'easy',
  'smiley face': 'easy',
  sun: 'easy',
  moon: 'easy',
  house: 'easy',
  tree: 'easy',
  flower: 'easy',
  star: 'easy',
  car: 'medium',
  bicycle: 'medium',
  boat: 'medium',
  airplane: 'medium',
  bird: 'medium',
  rabbit: 'medium',
  bridge: 'hard',
  castle: 'hard',
  octopus: 'hard',
  dragon: 'very hard',
  helicopter: 'very hard',
  saxophone: 'very hard'
}

const DIFFICULTY_ORDER = {
  'very easy': 0,
  easy: 1,
  medium: 2,
  hard: 3,
  'very hard': 4
}

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

function shuffle(items = []) {
  return [...items].sort(() => Math.random() - 0.5)
}

function pickUniqueWords(pool, count, excluded = new Set()) {
  const choices = []
  const shuffled = shuffle(pool)

  for (const word of shuffled) {
    if (choices.length >= count) break
    if (excluded.has(word)) continue
    choices.push(word)
    excluded.add(word)
  }
  return choices
}

function getDifficultyForWord(word) {
  const key = String(word || '').trim().toLowerCase()
  return WORD_DIFFICULTY[word] || GENERATED_WORD_DIFFICULTY[key] || 'hard'
}

export function getWordChoiceOptions() {
  const used = new Set()
  const labeledWords = WORD_POOL.filter((word) => {
    const difficulty = getDifficultyForWord(word)
    return typeof difficulty === 'string' && difficulty.length > 0
  })
  const veryEasyPool = labeledWords.filter((word) => getDifficultyForWord(word) === 'very easy')
  const easyPool = labeledWords.filter((word) => getDifficultyForWord(word) === 'easy')
  const mediumPool = labeledWords.filter((word) => getDifficultyForWord(word) === 'medium')
  const harderPool = labeledWords.filter((word) => {
    const difficulty = getDifficultyForWord(word)
    return difficulty === 'hard' || difficulty === 'very hard'
  })
  const guaranteedEasyWords = WORD_POOL.filter((word) => {
    const lower = normalizeWord(word)
    return (lower === 'house' || lower === 'sun') && easyPool.includes(word)
  })
  guaranteedEasyWords.forEach((word) => used.add(word))

  const picked = [
    ...pickUniqueWords(veryEasyPool, 1, used),
    ...guaranteedEasyWords,
    ...pickUniqueWords(easyPool, Math.max(0, 2 - guaranteedEasyWords.length), used),
    ...pickUniqueWords(mediumPool, 1, used),
    ...pickUniqueWords(harderPool, 1, used)
  ]

  if (picked.length < 5) {
    pickUniqueWords(labeledWords, 5 - picked.length, used).forEach((word) => {
      picked.push(word)
    })
  }

  return picked
    .map((word) => ({ word, difficulty: getDifficultyForWord(word) }))
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty])
}
