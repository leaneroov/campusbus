import "../css/reset.css";
import "../css/style.css";

import busdata from "./busdata.js";
import { getDateType } from "./calendar.js";

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
  const headerText = document.querySelector(".header_text");
  const navButtons = document.querySelectorAll(".nav__btn");
  const timetableLink = document.getElementById("timetable-link");
  const routeLink = document.getElementById("route-link");
  const footerDate = document.getElementById("footer-date");
  const darkModeBtn = document.getElementById("dark-mode-btn");
  const body = document.body;

  const weekdaysButton = navButtons[0];
  const weekendButton = navButtons[1];
  const vacationButton = navButtons[2];

  const darkMode = localStorage.getItem("darkMode");

  // Apply dark mode if previously enabled
  if (darkMode === "enabled") {
    body.classList.add("dark-mode");
    darkModeBtn.classList.remove("fa-moon");
    darkModeBtn.classList.add("fa-sun");
  }

  // Toggle dark mode on button click
  darkModeBtn.addEventListener("click", function () {
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
      darkModeBtn.classList.remove("fa-sun");
      darkModeBtn.classList.add("fa-moon");
    } else {
      body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
      darkModeBtn.classList.remove("fa-moon");
      darkModeBtn.classList.add("fa-sun");
    }
  });

  let currentMode = "weekdays";

  const links = {
    weekdays: {
      timetable:
        "https://www.miryang.go.kr/docviewer/index.jsp?atchFileId=FILE_000000000076490&fileSn=1&fileName=BBS_202501060246536911&fileSn=1&docName=1",
      route:
        "https://www.miryang.go.kr/docviewer/index.jsp?atchFileId=FILE_000000000057458&fileSn=5&fileName=BBS_202309070216369885&fileSn=5&docName=bus-every-20230907",
    },
  };

  links.weekend = {
    timetable:
      "https://www.miryang.go.kr/docviewer/index.jsp?atchFileId=FILE_000000000076490&fileSn=0&fileName=BBS_202501060246536840&fileSn=0&docName=2",
    route:
      "https://www.miryang.go.kr/docviewer/index.jsp?atchFileId=FILE_000000000057458&fileSn=0&fileName=BBS_202308210915280290&fileSn=0&docName=bus20230821-1",
  };
  links.vacation = links.weekend;

  let cam2sta = busdata.weekdayscam2sta;
  let sta2cam = busdata.weekdayssta2cam;

  if (!busdata || !busdata.weekdayscam2sta || !busdata.weekdayssta2cam) {
    if (informText1)
      informText1.innerText = "부산대 → 밀양역: 데이터를 불러오지 못했습니다.";
    if (informText2)
      informText2.innerText = "밀양역 → 부산대: 데이터를 불러오지 못했습니다.";
    return;
  }

  let showallTable1 = false;
  let showallTable2 = false;
  let refreshTime = null;
  let minuteTime = null;
  let oneSecondRefreshTime = null;
  let isRefreshing = false;
  let refreshCount = 0;

  allTable1.style.display = "none";
  allTable2.style.display = "none";

  function updateLinks(mode) {
    if (timetableLink && routeLink && links[mode]) {
      timetableLink.href = links[mode].timetable;
      routeLink.href = links[mode].route;
    }
  }

  function formatTimeForDisplay(minutes) {
    if (minutes < 60) {
      return `${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}시간`;
      } else {
        return `${hours}시간 ${remainingMinutes}분`;
      }
    }
  }

  function autoDetectMode() {
    const today = new Date();
    const dateType = getDateType(today);
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdayNames[today.getDay()];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dateString = `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;

    if (footerDate) {
      footerDate.textContent = dateString;
    }

    if (dateType === "vacation") {
      setVacation();
      headerText.textContent = `방학 - ${dateString}`;
    } else if (dateType === "weekend") {
      setWeekend();
      headerText.textContent = `주말·공휴일 - ${dateString}`;
    } else {
      setWeekday();
      headerText.textContent = `평일 - ${dateString}`;
    }
  }

  function busTables() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

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
      table.innerHTML = `<div class="bus-row"><div class="bus-cell" style="grid-column: 1 / span 5; text-align: center;">금일 운행 예정 버스 없음.</div></div>`;
      return;
    }

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
        row.innerHTML = `
          <div class="bus-cell">${bus.number ? `${bus.number}번` : "-"}</div>
          <div class="bus-cell">${bus.depart || "-"}</div>
          <div class="bus-cell">${bus.arrive || "-"}</div>
          <div class="bus-cell">${bus.yeongnamnu || "-"}</div>
          <div class="bus-cell">${bus.note || ""}</div>
        `;
      } else {
        row.innerHTML = `
          <div class="bus-cell">${bus.number ? `${bus.number}번` : "-"}</div>
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
      let busImminent = false;

      if (route1Data.length > 0) {
        const firstBus = route1Data[0];
        const nextBus = route1Data.length > 1 ? route1Data[1] : null;

        const [firstHour, firstMinute] = firstBus.depart.split(":").map(Number);
        const firstBusTime = firstHour * 60 + firstMinute;
        const diffMinutes = firstBusTime - currentTime;

        let text = "";
        if (diffMinutes <= 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 <span class="time-highlight">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
          busImminent = true;
        } else if (diffMinutes === 1 && currentSeconds > 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 <span class="time-highlight">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
          busImminent = true;
        } else {
          const formattedTime = formatTimeForDisplay(diffMinutes);
          text = `부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 <span class="time-highlight">${formattedTime}</span> 후 출발 (${firstBus.depart})`;
        }

        if (nextBus) {
          const [nextHour, nextMinute] = nextBus.depart.split(":").map(Number);
          const nextBusTime = nextHour * 60 + nextMinute;
          const nextDiffMinutes = nextBusTime - currentTime;

          if (nextDiffMinutes <= 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `<br /> 다음 버스 <span class="time-highlight">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
            busImminent = true;
          } else if (nextDiffMinutes === 1 && currentSeconds > 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `<br /> 다음 버스 <span class="time-highlight">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
            busImminent = true;
          } else {
            const formattedTime = formatTimeForDisplay(nextDiffMinutes);
            text += `<br /> 다음 버스 <span class="time-highlight">${formattedTime}</span> 후 (${nextBus.depart})`;
          }
        }

        informText1.innerHTML = text;
      } else {
        informText1.innerHTML =
          '부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 금일 운행 예정 버스 없음.';
      }

      if (route2Data.length > 0) {
        const firstBus = route2Data[0];
        const nextBus = route2Data.length > 1 ? route2Data[1] : null;

        const [firstHour, firstMinute] = firstBus.depart.split(":").map(Number);
        const firstBusTime = firstHour * 60 + firstMinute;
        const diffMinutes = firstBusTime - currentTime;

        let text = "";
        if (diffMinutes <= 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `밀양역 <i class="fa-solid fa-arrow-right"></i> 부산대 <span class="time-highlight">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
          busImminent = true;
        } else if (diffMinutes === 1 && currentSeconds > 0) {
          const remainingSeconds = 60 - currentSeconds;
          text = `밀양역 <i class="fa-solid fa-arrow-right"></i> 부산대 <span class="time-highlight">${remainingSeconds}초</span> 후 출발 (${firstBus.depart})`;
          busImminent = true;
        } else {
          const formattedTime = formatTimeForDisplay(diffMinutes);
          text = `밀양역 <i class="fa-solid fa-arrow-right"></i> 부산대 <span class="time-highlight">${formattedTime}</span> 후 출발 (${firstBus.depart})`;
        }

        if (nextBus) {
          const [nextHour, nextMinute] = nextBus.depart.split(":").map(Number);
          const nextBusTime = nextHour * 60 + nextMinute;
          const nextDiffMinutes = nextBusTime - currentTime;

          if (nextDiffMinutes <= 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `<br /> 다음 버스 <span class="time-highlight">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
            busImminent = true;
          } else if (nextDiffMinutes === 1 && currentSeconds > 0) {
            const remainingSeconds = 60 - currentSeconds;
            text += `<br /> 다음 버스 <span class="time-highlight">${remainingSeconds}초</span> 후 (${nextBus.depart})`;
            busImminent = true;
          } else {
            const formattedTime = formatTimeForDisplay(nextDiffMinutes);
            text += `<br /> 다음 버스 <span class="time-highlight">${formattedTime}</span> 후 (${nextBus.depart})`;
          }
        }

        informText2.innerHTML = text;
      } else {
        informText2.innerHTML = `밀양역 <i class="fa-solid fa-arrow-right"></i> 금일 부산대 운행 예정 버스 없음.`;
      }

      if (busImminent) {
        enableOneSecondRefresh();
      } else {
        disableOneSecondRefresh();
      }
    } catch (error) {
      console.error("시간 업데이트 오류:", error);
      return;
    }
  }
  function enableOneSecondRefresh() {
    if (oneSecondRefreshTime) return;

    stopFirstRefresh();
    if (minuteTime) {
      clearInterval(minuteTime);
      minuteTime = null;
    }

    oneSecondRefreshTime = setInterval(() => {
      updateCell();
    }, 1000);
  }

  function disableOneSecondRefresh() {
    if (!oneSecondRefreshTime) return;

    clearInterval(oneSecondRefreshTime);
    oneSecondRefreshTime = null;

    if (isRefreshing && !refreshTime && !minuteTime) {
      const now = new Date();
      const seconds = now.getSeconds();

      if (seconds < 55) {
        refreshTime = setInterval(() => {
          updateCell();
          refreshCount += 1;

          if (refreshCount >= 4) {
            stopFirstRefresh();
            zerosecRefresh();
          }
        }, 5000);
      } else {
        zerosecRefresh();
      }
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

      if (refreshCount >= 4) {
        stopFirstRefresh();
        zerosecRefresh();
      }
    }, 5000);
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

      minuteTime = setInterval(() => {
        updateCell();
      }, 60000);
    }, millisToNextMinute);
  }

  function stopRefreshes() {
    stopFirstRefresh();
    if (minuteTime) {
      clearInterval(minuteTime);
      minuteTime = null;
    }
    if (oneSecondRefreshTime) {
      clearInterval(oneSecondRefreshTime);
      oneSecondRefreshTime = null;
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

  function setWeekday() {
    currentMode = "weekdays";
    cam2sta = busdata.weekdayscam2sta;
    sta2cam = busdata.weekdayssta2cam;

    weekdaysButton.classList.add("active");
    weekendButton.classList.remove("active");
    vacationButton.classList.remove("active");

    updateLinks(currentMode);
    updateCell();
    resetTable();
  }

  function setWeekend() {
    currentMode = "weekend";
    cam2sta = busdata.weekendcam2sta;
    sta2cam = busdata.weekendsta2cam;

    weekdaysButton.classList.remove("active");
    weekendButton.classList.add("active");
    vacationButton.classList.remove("active");

    updateLinks(currentMode);
    updateCell();
    resetTable();
  }

  function setVacation() {
    currentMode = "vacation";
    cam2sta = busdata.vacationcam2sta;
    sta2cam = busdata.vacationsta2cam;

    weekdaysButton.classList.remove("active");
    weekendButton.classList.remove("active");
    vacationButton.classList.add("active");

    updateLinks(currentMode);
    updateCell();
    resetTable();
  }

  function resetTable() {
    showallTable1 = false;
    showallTable2 = false;
    allTable1.style.display = "none";
    allTable2.style.display = "none";
    firstTable.style.display = "block";
    secondTable.style.display = "block";
    updateButtonText();
  }

  function checkDateChange() {
    let lastDate = new Date().getDate();

    setInterval(() => {
      const currentDate = new Date().getDate();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        autoDetectMode();
      }
    }, 60000);
  }

  function updateFooterText() {
    if (footerDate) {
      const today = new Date();
      const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = weekdayNames[today.getDay()];
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const date = today.getDate();
      const dateString = `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;
      footerDate.textContent = dateString;
    }
  }

  autoDetectMode();
  updateButtonText();
  autoRefresh();
  checkDateChange();
  updateFooterText();

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
    toggleRefresh();
  });

  weekdaysButton.addEventListener("click", function (event) {
    event.preventDefault();
    const today = new Date();
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdayNames[today.getDay()];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dateString = `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;

    setWeekday();
    headerText.textContent = `평일 - ${dateString}`;
  });

  weekendButton.addEventListener("click", function (event) {
    event.preventDefault();
    const today = new Date();
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdayNames[today.getDay()];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dateString = `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;

    setWeekend();
    headerText.textContent = `주말·공휴일 - ${dateString}`;
  });

  vacationButton.addEventListener("click", function (event) {
    event.preventDefault();
    const today = new Date();
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdayNames[today.getDay()];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dateString = `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;

    setVacation();
    headerText.textContent = `방학 - ${dateString}`;
  });

  function privateEmail() {
    const emailElement = document.querySelector(".footer-email");
    if (!emailElement) return;

    const parts = {
      front: atob("aW1wbGFudC5zdGFmZmVyNzQ="),
    };

    const fullEmail = `Website Developer Contact: ${parts.front}@icloud.com`;
    emailElement.textContent = fullEmail;
    emailElement.removeAttribute("href");

    emailElement.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = `mailto:${fullEmail}`;
    });

    emailElement.style.cursor = "pointer";
  }
  privateEmail();
});
