import test from 'node:test'
import assert from 'node:assert/strict'
import { calcFinalGrade, isPassed, formatGrade, gradeColor, statusColor, displayFinal } from '../src/lib/grades.js'

test('итог: 5 5 5 = 5', () => {
  assert.equal(calcFinalGrade({ lab: 5, coursework: 5, exam: 5 }), 5)
})

test('итог: 5 4 5 = 4.7', () => {
  assert.equal(calcFinalGrade({ lab: 5, coursework: 4, exam: 5 }), 5 * 0.3 + 4 * 0.3 + 5 * 0.4)
})

test('итог: 3 3 2 = 2.6', () => {
  assert.ok(Math.abs(calcFinalGrade({ lab: 3, coursework: 3, exam: 2 }) - 2.6) < 1e-9)
})

test('итог: 2 2 2 = 2', () => {
  assert.equal(calcFinalGrade({ lab: 2, coursework: 2, exam: 2 }), 2)
})

test('веса в сумме дают 1', () => {
  assert.equal(0.3 + 0.3 + 0.4, 1)
})

test('экзамен весит больше лабораторной', () => {
  const a = calcFinalGrade({ lab: 5, coursework: 3, exam: 3 })
  const b = calcFinalGrade({ lab: 3, coursework: 3, exam: 5 })
  assert.ok(b > a)
})

test('сдано при итоге 3', () => {
  assert.equal(isPassed(3), true)
})

test('сдано при итоге 5', () => {
  assert.equal(isPassed(5), true)
})

test('неуд при итоге 2.99', () => {
  assert.equal(isPassed(2.99), false)
})

test('неуд при итоге 2', () => {
  assert.equal(isPassed(2), false)
})

test('formatGrade пустое значение — тире', () => {
  assert.equal(formatGrade(null), '—')
  assert.equal(formatGrade(''), '—')
})

test('formatGrade округляет до сотых', () => {
  assert.equal(formatGrade(4.2), '4.20')
})

test('зелёный балл от 4', () => {
  assert.equal(gradeColor(4), 'green')
  assert.equal(gradeColor(5), 'green')
})

test('синий балл от 3 до 4', () => {
  assert.equal(gradeColor(3), 'blue')
  assert.equal(gradeColor(3.9), 'blue')
})

test('красный балл ниже 3', () => {
  assert.equal(gradeColor(2.9), 'red')
})

test('пустой балл без цвета', () => {
  assert.equal(gradeColor(null), '')
})

test('статус Учится зелёный', () => {
  assert.equal(statusColor('Учится'), 'green')
})

test('статус академ синий', () => {
  assert.equal(statusColor('Академ. отпуск'), 'blue')
})

test('статус отчислен красный', () => {
  assert.equal(statusColor('Отчислен'), 'red')
})

test('зачёт: 5 это зачтено', () => {
  assert.equal(displayFinal({ exam: 5 }, 'Зачёт'), 'зачтено')
})

test('зачёт: 2 это незачтено', () => {
  assert.equal(displayFinal({ exam: 2 }, 'Зачёт'), 'незачтено')
})

test('зачёт без оценки — тире', () => {
  assert.equal(displayFinal({ exam: '' }, 'Зачёт'), '—')
})

test('экзамен без одной оценки — тире', () => {
  assert.equal(displayFinal({ lab: 5, coursework: '', exam: 5 }, 'Экзамен'), '—')
})
