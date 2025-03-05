document.addEventListener("DOMContentLoaded", function () {
  const first = [
    //부산대 밀양캠퍼스 → 밀양역
    { number: "7", depart: "9:06", arrive: "9:38", note: "구도로" },
    { number: "24", depart: "9:35", arrive: "9:52", note: "구도로" },
    { number: "1", depart: "9:46", arrive: "10:06", note: "구도로" },
  ];
  const second = [
    //밀양역 → 부산대 밀양캠퍼스
    { number: "2", depart: "9:58", arrive: "10:18", note: "구도로" },
    { number: "4-1", depart: "10:16", arrive: "10:30", note: "구도로" },
    { number: "2", depart: "10:38", arrive: "10:40", note: "" },
  ];

  function addinfo(tableId, data) {
    const table = document.getElementById(tableId);

    data.forEach((bus) => {
      const row = document.createElement("div");
      row.classList.add("bus-row");
      row.innerHTML = `
                <div class="bus-cell">${bus.number}</div>
                <div class="bus-cell">${bus.depart}</div>
                <div class="bus-cell">${bus.arrive}</div>
                <div class="bus-cell">${bus.note}</div>
            `;
      table.appendChild(row);
    });
  }

  addinfo("first-timetable", first);
  addinfo("second-timetable", second);
});
