SELECT
  s.id,
  s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
  g.name AS group_name,
  s.form,
  s.status,
  (
    SELECT ROUND(AVG(gr.lab * 0.3 + gr.coursework * 0.3 + gr.exam * 0.4), 2)
    FROM grades gr
    JOIN assignments a ON a.id = gr.assignment_id
    JOIN disciplines d ON d.id = a.discipline_id
    WHERE gr.student_id = s.id
      AND d.control IN ('Экзамен', 'Диф. зачёт')
      AND gr.lab IS NOT NULL
      AND gr.coursework IS NOT NULL
      AND gr.exam IS NOT NULL
  ) AS gpa
FROM students s
JOIN groups g ON g.id = s.group_id
ORDER BY g.name, s.last_name, s.first_name;

-- Журнал по назначению
SELECT
  s.id AS student_id,
  s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
  gr.lab,
  gr.coursework,
  gr.exam,
  CASE
    WHEN d.control = 'Зачёт' AND gr.exam IS NOT NULL THEN
      CASE WHEN gr.exam >= 3 THEN 'зачтено' ELSE 'незачтено' END
    WHEN gr.lab IS NOT NULL AND gr.coursework IS NOT NULL AND gr.exam IS NOT NULL THEN
      ROUND(gr.lab * 0.3 + gr.coursework * 0.3 + gr.exam * 0.4, 2)
    ELSE NULL
  END AS final_grade
FROM students s
LEFT JOIN grades gr ON gr.student_id = s.id AND gr.assignment_id = :assignment_id
JOIN assignments a ON a.id = :assignment_id
JOIN disciplines d ON d.id = a.discipline_id
WHERE s.group_id = a.group_id
ORDER BY s.last_name, s.first_name;

-- Рейтинг группы за семестр
SELECT
  s.id,
  s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
  ROUND(AVG(gr.lab * 0.3 + gr.coursework * 0.3 + gr.exam * 0.4), 2) AS gpa,
  SUM(CASE WHEN (gr.lab * 0.3 + gr.coursework * 0.3 + gr.exam * 0.4) < 3 THEN 1 ELSE 0 END) AS debts
FROM students s
JOIN grades gr ON gr.student_id = s.id
JOIN assignments a ON a.id = gr.assignment_id
JOIN disciplines d ON d.id = a.discipline_id
WHERE s.group_id = :group_id
  AND a.semester_id = :semester_id
  AND d.control IN ('Экзамен', 'Диф. зачёт')
  AND gr.lab IS NOT NULL AND gr.coursework IS NOT NULL AND gr.exam IS NOT NULL
GROUP BY s.id
ORDER BY gpa DESC;
