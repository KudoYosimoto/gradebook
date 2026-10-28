const WEIGHTS = { lab: 0.3, coursework: 0.3, exam: 0.4 }

/** Итог по дисциплине: лаб × 0.3 + КР × 0.3 + экзамен × 0.4. */
export function calcFinalGrade({ lab, coursework, exam }) {
  return lab * WEIGHTS.lab + coursework * WEIGHTS.coursework + exam * WEIGHTS.exam
}

/** «Сдано», если итог не ниже 3. */
export function isPassed(finalGrade) {
  return finalGrade >= 3
}

/** 4.7 → "4.70", пусто → "—". */
export function formatGrade(value) {
  if (value == null || value === '') return '—'
  return Number(value).toFixed(2)
}

/** Цвет балла: ≥4 зелёный, ≥3 синий, ниже — красный. Имена совпадают с CSS-классами. */
export function gradeColor(value) {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  if (n >= 4) return 'green'
  if (n >= 3) return 'blue'
  return 'red'
}

export function statusColor(status) {
  if (status === 'Учится' || status === 'Сдано' || status === 'Да' || status === 'зачтено') return 'green'
  if (status === 'Академ. отпуск') return 'blue'
  return 'red'
}

/**
 * Что показать в колонке «Итог»:
 * зачёт → "зачтено"/"незачтено"; экзамен → число; не хватает оценок → "—".
 */
export function displayFinal(row, control) {
  if (control === 'Зачёт') {
    if (row.exam === '' || row.exam == null) return '—'
    return Number(row.exam) >= 3 ? 'зачтено' : 'незачтено'
  }
  if (row.lab === '' || row.coursework === '' || row.exam === '' || row.lab == null || row.coursework == null || row.exam == null) {
    return '—'
  }
  return calcFinalGrade({
    lab: Number(row.lab),
    coursework: Number(row.coursework),
    exam: Number(row.exam),
  })
}
