const calendar2025 = [
  "2025-01-01", // 신정
  "2025-02-01", // 설날
  "2025-02-02", // 설날 연휴
  "2025-02-03", // 설날 연휴
  "2025-03-01", // 삼일절
  "2025-05-05", // 어린이날
  "2025-05-15", // 부처님오신날
  "2025-06-06", // 현충일
  "2025-08-15", // 광복절
  "2025-09-20", // 추석
  "2025-09-21", // 추석 연휴
  "2025-09-22", // 추석 연휴
  "2025-10-03", // 개천절
  "2025-10-09", // 한글날
  "2025-12-25", // 크리스마스
  "2025-05-06", // 어린이날 대체공휴일
];

const vacationday = [];

const summerVacationStart = new Date(2025, 6, 23);
const secsemester = new Date(2025, 9, 1);

for (
  let day = new Date(summerVacationStart);
  day < secsemester;
  day.setDate(day.getDate() + 1)
) {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  vacationday.push(`${year}-${month}-${date}`);
}

function getDateType(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  if (vacationday.includes(formattedDate)) {
    return "vacation";
  }

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = calendar2025.includes(formattedDate);

  if (isWeekend || isHoliday) {
    return "weekend";
  } else {
    return "weekday";
  }
}

export { getDateType };
