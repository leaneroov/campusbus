import busdata from "./busdata.js";

document.addEventListener("DOMContentLoaded", function () {
  const btn1 = document.getElementById("btn1");
  const btn2 = document.getElementById("btn2");
  const refreshBtn = document.getElementById("refresh-btn");
  const allTable1 = document.getElementById("all-timetable1");
  const allTable2 = document.getElementById("all-timetable2");
  const firstTable = document.getElementById("first-timetable");
  const secondTable = document.getElementById("second-timetable");
  const informText1 = document.getElementById("inform-text1");
  const informText2 = document.getElementById("inform-text2");

  // 데이터 에러
  if (!busdata || !busdata.cam2sta || !busdata.sta2cam) {
    if (informText1)
      informText1.innerText = "부산대 → 밀양역: 데이터를 불러오지 못했습니다.";
    if (informText2)
      informText2.innerText = "밀양역 → 부산대: 데이터를 불러오지 못했습니다.";
    return; // 데이터가 없으면 더 이상 진행하지 않음
  }

  const cam2sta = busdata.cam2sta;
  const sta2cam = busdata.sta2cam;

  let showallTable1 = false;
  let showallTable2 = false;
  let refreshTime = null;
  let minuteTime = null;
  let isRefreshing = false;
  let refreshCount = 0; // 리프레시 횟ㅜ

  allTable1.style.display = "none";
  allTable2.style.display = "none";

  function busTables() {
    //버스 시간 함수
    const now = new Date(); // 현재 시간
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 시 -> 분

    const nextCam2sta = cam2sta.filter((bus) => {
      if (!bus.depart) return false;
      const timeParts = bus.depart.split(":");
      const hour = Number(timeParts[0]);
      const minute = Number(timeParts[1]);
      const convertDpt = hour * 60 + minute;
      return convertDpt >= currentTime;
    });

    const nextSta2cam = sta2cam.filter((bus) => {
      if (!bus.depart) return false;
      const timeParts = bus.depart.split(":");
      const hour = Number(timeParts[0]);
      const minute = Number(timeParts[1]);
      const convertDpt = hour * 60 + minute;
      return convertDpt >= currentTime;
    });

    updateMainTable(nextCam2sta, firstTable, true);
    updateMainTable(nextSta2cam, secondTable, false);
    updateFullTable(cam2sta, allTable1, true);
    updateFullTable(sta2cam, allTable2, false);
    updateInformText(nextCam2sta, nextSta2cam, currentTime);
  }

  function updateMainTable(data, table, isRoute1) {
    if (!table) return;

    table.innerHTML = "";

    if (data.length === 0) {
      table.innerHTML = `<div class="bus-row"><div class="bus-cell" style="grid-column: 1 / span 5; text-align: center;">운행 예정 버스 없음.</div></div>`;
      return;
    }

    // 제일 빠른 3개만 표시
    const topItems = data.slice(0, 3);
    appendBusRows(topItems, table, isRoute1);
  }

  function updateFullTable(data, table, isRoute1) {
    if (!table) return;

    table.innerHTML = "";

    if (data.length === 0) {
      table.innerHTML = `<div class="bus-row"><div class="bus-cell" style="grid-column: 1 / span 5; text-align: center;">시간표 데이터 없음.</div></div>`;
      return;
    }
    appendBusRows(data, table, isRoute1);
  }

  function appendBusRows(busData, table, isRoute1) {
    busData.forEach((bus) => {
      const row = document.createElement("div");
      row.classList.add("bus-row");

      if (isRoute1) {
        // 부산대→밀양역
        row.innerHTML = `
          <div class="bus-cell">${`${bus.number}번` || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      } else {
        // 밀양역→부산대
        row.innerHTML = `
          <div class="bus-cell">${`${bus.number}번` || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      }

      table.appendChild(row);
    });
  }

  function updateInformText(route1Data, route2Data, currentTime) {
    try {
      const now = new Date();
      const currentSeconds = now.getSeconds();

      if (route1Data.length > 0) {
        const firstBus = route1Data[0];
        const nextBus = route1Data.length > 1 ? route1Data[1] : null;

        const [firstHour, firstMinute] = firstBus.depart.split(":").map(Number);
        const firstBusTime = firstHour * 60 + firstMinute;
        const diffMinutes = firstBusTime - currentTime;

        let text = "";
        if (diffMinutes <= 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `부산대 → 밀양역: <span style="color: #103095;">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
        } else if (diffMinutes === 1 && currentSeconds > 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `부산대 → 밀양역: <span style="color: #103095;">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
        } else {
          text = `부산대 → 밀양역: <span style="color: #103095;">${diffMinutes}분</span> 후 출발 (${firstBus.depart})`;
        }

        if (nextBus) {
          const [nextHour, nextMinute] = nextBus.depart.split(":").map(Number);
          const nextBusTime = nextHour * 60 + nextMinute;
          const nextDiffMinutes = nextBusTime - currentTime;

          if (nextDiffMinutes <= 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `, 다음 버스 <span style="color: #103095;">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
          } else if (nextDiffMinutes === 1 && currentSeconds > 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `, 다음 버스 <span style="color: #103095;">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
          } else {
            text += `, 다음 버스 <span style="color: #103095;">${nextDiffMinutes}분</span> 후 (${nextBus.depart})`;
          }
        }

        informText1.innerHTML = text;
      } else {
        informText1.innerText = "부산대 → 밀양역: 운행 예정 버스 없음.";
      }

      // 밀양역 → 부산대 inform-text
      if (route2Data.length > 0) {
        const firstBus = route2Data[0];
        const nextBus = route2Data.length > 1 ? route2Data[1] : null;

        const [firstHour, firstMinute] = firstBus.depart.split(":").map(Number);
        const firstBusTime = firstHour * 60 + firstMinute;
        const diffMinutes = firstBusTime - currentTime;

        let text = "";
        if (diffMinutes <= 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `밀양역 → 부산대: <span style="color: #103095;">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
        } else if (diffMinutes === 1 && currentSeconds > 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `밀양역 → 부산대: <span style="color: #103095;">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
        } else {
          text = `밀양역 → 부산대: <span style="color: #103095;">${diffMinutes}분</span> 후 출발 (${firstBus.depart})`;
        }

        if (nextBus) {
          const [nextHour, nextMinute] = nextBus.depart.split(":").map(Number);
          const nextBusTime = nextHour * 60 + nextMinute;
          const nextDiffMinutes = nextBusTime - currentTime;

          if (nextDiffMinutes <= 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `, 다음 버스 <span style="color: #103095;">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
          } else if (nextDiffMinutes === 1 && currentSeconds > 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `, 다음 버스 <span style="color: #103095;">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
          } else {
            text += `, 다음 버스 <span style="color: #103095;">${nextDiffMinutes}분</span> 후 (${nextBus.depart})`;
          }
        }

        informText2.innerHTML = text;
      } else {
        informText2.innerText = "밀양역 → 부산대: 운행 예정 버스 없음.";
      }
    } catch (error) {
      return;
    }
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
    busTables();
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

      // 4번 자동 새로고침 -> 00초 새로고침
      if (refreshCount >= 4) {
        stopFirstRefresh();
        zerosecRefresh();
      }
    }, 5000); //5초
  }

  function stopFirstRefresh() {
    if (refreshTime) {
      clearInterval(refreshTime);
      refreshTime = null;
    }
  }

  function iszerosec(callback, delay) {
    setTimeout(callback, delay);
  }

  function zerosecRefresh() {
    const now = new Date();
    const seconds = now.getSeconds();
    const millisToNextMinute = (60 - seconds) * 1000;

    iszerosec(() => {
      updateCell();

      // 그 후 1분 마다 리프레시
      minuteTime = setInterval(() => {
        updateCell();
      }, 60000); //
    }, millisToNextMinute);
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

  updateCell();
  updateButtonText();
  autoRefresh();

  btn1.addEventListener("click", function () {
    showallTable1 = !showallTable1;
    allTable1.style.display = showallTable1 ? "block" : "none";
    firstTable.style.display = showallTable1 ? "none" : "block";
    updateButtonText();
  });

  btn2.addEventListener("click", function () {
    showallTable2 = !showallTable2;
    allTable2.style.display = showallTable2 ? "block" : "none";
    secondTable.style.display = showallTable2 ? "none" : "block";
    updateButtonText();
  });

  refreshBtn.addEventListener("click", function () {
    toggleRefresh(); // 새로고침 버튼 클릭시 리프레시 그만
  });
});
