import busdata from "./busdata.js";
const btn1 = document.getElementById("btn1");
const btn2 = document.getElementById("btn2");
const refreshBtn = document.getElementById("refresh-btn");
const allTable1 = document.getElementById("all-timetable1");
const allTable2 = document.getElementById("all-timetable2");

document.addEventListener("DOMContentLoaded", function () {
  const cam2sta = busdata.cam2sta;
  const sta2cam = busdata.sta2cam;

  let showallTable1 = false;
  let showallTable2 = false;
  let refreshTime = null;
  let minuteTime = null;
  let isRefreshing = false;
  let refreshCount = 0; // 초기 새로고침 횟수

  allTable1.style.display = "none";
  allTable2.style.display = "none";

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

    let showData = [...data];
    if (showUpcomingOnly) {
      // 현재 시간 이후 버스만 필터링
      let upcomingCount = 0;
      showData = showData.filter((item) => {
        if (!item.depart) {
          return false;
        }
        const timeParts = item.depart.split(":");
        const hour = Number(timeParts[0]); // 시
        const minute = Number(timeParts[1]); // 분
        const convertDpt = hour * 60 + minute; // 시간 분으로 전환

        if (
          convertDpt >= currentTime &&
          (tableId.includes("all") || upcomingCount < 3)
        ) {
          upcomingCount++;
          return true;
        }
        return false;
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
    if (!table) {
      return;
    }

    table.innerHTML = "";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let showData = [...data];
    if (showUpcomingOnly) {
      let upcomingBuses = showData.filter((item) => {
        if (!item.depart) {
          return false;
        }
        const timeParts = item.depart.split(":");
        const hour = Number(timeParts[0]);
        const minute = Number(timeParts[1]);
        const convertDpt = hour * 60 + minute;
        return convertDpt >= currentTime;
      });
      showData = upcomingBuses.slice(3);
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
    if (btn1) {
      btn1.textContent = showallTable1 ? "접기" : "전체 시간표 보기";
    }
    if (btn2) {
      btn2.textContent = showallTable2 ? "접기" : "전체 시간표 보기";
    }
  }

  function updateCell() {
    addinfo("first-timetable", cam2sta, !showallTable1);
    addinfo("second-timetable", sta2cam, !showallTable2);
  }

  function autoRefresh() {
    stopRefreshes();
    refreshBtn.classList.add("rotating");
    updateCell();
    isRefreshing = true;
    refreshCount = 0;

    refreshTime = setInterval(() => {
      updateCell();
      refreshCount += 1;

      // 4번 자동 새로고침 -> 1분 간격으로 자로고침
      if (refreshCount >= 4) {
        stopFirstRefresh();
        startMinuteRefresh();
      }
    }, 5000); //5초
  }

  function stopFirstRefresh() {
    if (refreshTime) {
      clearInterval(refreshTime);
      refreshTime = null;
    }
  }

  // 1분 마다 새로고침
  function startMinuteRefresh() {
    minuteTime = setInterval(() => {
      updateCell();
    }, 60000); // 1분
  }

  function stopRefreshes() {
    stopFirstRefresh();
    if (minuteTime) {
      clearInterval(minuteTime);
      minuteTime = null;
    }
    refreshBtn.classList.remove("rotating");
    isRefreshing = false;
  }

  function toggleRefresh() {
    if (isRefreshing) {
      stopRefreshes();
    } else {
      autoRefresh();
    }
  }
  addallInfo("all-timetable1", cam2sta, !showallTable1);
  addallInfo("all-timetable2", sta2cam, !showallTable2);

  updateCell();
  updateButtonText();
  autoRefresh();

  btn1.addEventListener("click", function () {
    showallTable1 = !showallTable1;

    if (allTable1) {
      allTable1.style.display = showallTable1 ? "block" : "none";
    }

    addinfo("first-timetable", cam2sta, !showallTable1);
    addallInfo("all-timetable1", cam2sta, !showallTable1);
    updateButtonText();
  });

  btn2.addEventListener("click", function () {
    showallTable2 = !showallTable2;
    if (allTable2) {
      allTable2.style.display = showallTable2 ? "block" : "none";
    }
    addinfo("second-timetable", sta2cam, !showallTable2);
    addallInfo("all-timetable2", sta2cam, !showallTable2);
    updateButtonText();
  });

  refreshBtn.addEventListener("click", function () {
    toggleRefresh(); // 새로고침 버튼 클릭시 리프레시 그만
  });
});
