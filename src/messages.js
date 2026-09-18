const ORDINALS = [
  null, // 0 unused
  'первый',
  'второй',
  'третий',
  'четвёртый',
  'пятый',
  'шестой',
  'седьмой',
  'восьмой',
  'девятый',
  'десятый',
  'одиннадцатый',
  'двенадцатый',
  'тринадцатый',
  'четырнадцатый',
  'пятнадцатый',
  'шестнадцатый',
  'семнадцатый',
  'восемнадцатый',
  'девятнадцатый',
  'двадцатый',
];

function ordinal(n) {
  return ORDINALS[n] || `${n}-й`;
}

function pluralKazakh(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'казах';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'казаха';
  return 'казахов';
}

export function stillSameMessage(count) {
  if (count === 1) {
    return '⏳ В тоне все еще 1 казах..';
  }
  return `⏳ В тоне все еще ${count} ${pluralKazakh(count)}..`;
}

export function holdersIncreasedMessage(newCount) {
  return `🔥 В тоне появился ${ordinal(newCount)} казах`;
}

export function holdersDecreasedMessage(newCount, previousCount) {
  if (newCount === 0) {
    return `📉 В тоне не осталось ни одного казаха (было ${previousCount})`;
  }
  return `📉 В тоне стало меньше казахов: было ${previousCount}, осталось ${newCount} (${pluralKazakh(
    newCount
  )})`;
}
