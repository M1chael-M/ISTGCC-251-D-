// Список домашних заданий, отдельно для каждой группы.
// Формат: window.HOMEWORK_DATA = { "Код группы": [ {subject, date, task}, ... ] }
//   subject — название предмета
//   date    — срок сдачи, формат ГГГГ-ММ-ДД (например "2026-10-12")
//   task    — само задание (можно длинный текст)
//
// Пока не наступила дата (включительно) — задание показывается во вкладке
// "Active" именно у той группы, к которой оно привязано. На следующий день
// после даты оно само переезжает в "Arhivă". Просто добавляй новые объекты
// в массив нужной группы, порядок внутри массива не важен — сортировка
// идёт автоматически.
//
// Коды групп должны совпадать с теми, что в data.js: "ISTGCC-251" и
// "ISTGCC-251 D" (у второй — пробел перед D).

window.HOMEWORK_DATA = {
  "ISTGCC-251": [
    {
      "subject": "Mecanica aplicată",
      "date": "2026-10-12",
      "task": "Rezolvă exercițiile 1–4 din îndrumar, cap. 2."
    },
    {
      "subject": "Electrotehnica aplicată (lab)",
      "date": "2026-09-20",
      "task": "Pregătește darea de seamă pentru lucrarea de laborator nr. 1."
    }
  ],
  "ISTGCC-251 D": [
    {
      "subject": "Sisteme de alimentare cu gaze I",
      "date": "2026-10-15",
      "task": "Pregătește referatul la tema curs 3."
    }
  ]
};
