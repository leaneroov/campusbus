import busdata from "./busdata.js";
const btn1 = document.getElementById("btn1");
const btn2 = document.getElementById("btn2");

document.addEventListener("DOMContentLoaded", function () {
  const cam2sta = busdata.cam2sta;
  const sta2cam = busdata.sta2cam;

  let showallTable1 = false;
  let showallTable2 = false;

  let allTable1 = document.getElementById("all-timetable1");
  let allTable2 = document.getElementById("all-timetable2");

  if (allTable1) {
    allTable1.style.display = "none";
  }
  if (allTable2) {
    allTable2.style.display = "none";
  }

  try {
    // 데이터 확인
    if (!cam2sta || !sta2cam) {
      alert("데이터 불러오기 실패.");
    }
  } catch (error) {
    alert("데이터 불러오기 실패.");
  }

  function addinfo(tableId, data, showUpcomingOnly = true) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.innerHTML = "";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 현재시간 분으로 변환

    let showData = data;
    if (showUpcomingOnly) {
      // 현재 시간 이후 버스만 필터링
      showData = data.filter((item) => {
        if (!item.depart) return false;
        const timeParts = item.depart.split(":");
        const hour = Number(timeParts[0]); // 시
        const minute = Number(timeParts[1]); // 분
        const convertDpt = hour * 60 + minute; // 시간 분으로 전환
        return convertDpt >= currentTime; // 현재시간보다 늦은 버스만 표시
      });
    }

    // 데이터가 없을 경우
    if (showData.length === 0) {
      table.innerHTML = `<div class="bus-row"><div class="bus-cell" style="grid-column: 1 / span 5; text-align: center;">운행 예정 버스 없음.</div></div>`;
      return;
    }

    // 3개 표시
    const displayData = tableId.includes("all")
      ? showData
      : showData.slice(0, 3);

    displayData.forEach((bus) => {
      const row = document.createElement("div");
      row.classList.add("bus-row");

      if (tableId.includes("first") || tableId.includes("all-timetable1")) {
        row.innerHTML = `
          <div class="bus-cell">${bus.number || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      } else {
        row.innerHTML = `
          <div class="bus-cell">${bus.number || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      }

      table.appendChild(row);
    });
  }

  function addallInfo(tableId, data, showUpcomingOnly = true) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.innerHTML = "";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let showData = data;
    if (showUpcomingOnly) {
      showData = data.filter((item) => {
        if (!item.depart) return false;
        const timeParts = item.depart.split(":");
        const hour = Number(timeParts[0]);
        const minute = Number(timeParts[1]);
        const convertDpt = hour * 60 + minute;
        return convertDpt >= currentTime;
      });
    }

    // 3개 밑에 데이터만 표시
    const allData = showData.slice(3);

    allData.forEach((bus) => {
      const row = document.createElement("div");
      row.classList.add("bus-row");

      if (tableId === "all-timetable1") {
        row.innerHTML = `
          <div class="bus-cell">${bus.number || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      } else {
        row.innerHTML = `
          <div class="bus-cell">${bus.number || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      }

      table.appendChild(row);
    });
  }

  function updateButtonText() {
    if (btn1) btn1.textContent = showallTable1 ? "접기" : "전체 시간표 보기";
    if (btn2) btn2.textContent = showallTable2 ? "접기" : "전체 시간표 보기";
  }

  addinfo("first-timetable", cam2sta, true);
  addinfo("second-timetable", sta2cam, true);
  addallInfo("all-timetable1", cam2sta, true);
  addallInfo("all-timetable2", sta2cam, true);

  document.getElementById("btn1").addEventListener("click", function () {
    showallTable1 = !showallTable1;

    if (allTable1) {
      allTable1.style.display = showallTable1 ? "block" : "none";
    }

    addinfo("first-timetable", cam2sta, !showallTable1);
    addallInfo("all-timetable1", cam2sta, !showallTable1);
    updateButtonText();
  });

  document.getElementById("btn2").addEventListener("click", function () {
    showallTable2 = !showallTable2;
    if (allTable2) {
      allTable2.style.display = showallTable2 ? "block" : "none";
    }
    addinfo("second-timetable", sta2cam, !showallTable2);
    addallInfo("all-timetable2", sta2cam, !showallTable2);
    updateButtonText();
  });

  updateButtonText();
});
