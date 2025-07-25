export const MILITARY_RANKS = [
  'Гражданский персонал',
  'Рядовой',
  'Ефрейтор',
  'Младший сержант',
  'Сержант',
  'Старший сержант',
  'Старшина',
  'Прапорщик',
  'Старший прапорщик',
  'Лейтенант',
  'Старший лейтенант',
  'Капитан',
  'Майор',
  'Подполковник',
  'Полковник',
  'Генерал-майор',
  'Генерал-лейтенант',
  'Генерал-Полковник'
] as const

export type MilitaryRank = typeof MILITARY_RANKS[number] 