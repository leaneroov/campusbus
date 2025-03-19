import "../css/base/reset.css";
import "../css/base/global.css";
import "../css/base/variables.css";
import "../css/components/header.css";
import "../css/components/inform.css";
import "../css/components/table.css";
import "../css/components/buttons.css";
import "../css/components/navigation.css";
import "../css/components/footer.css";
import "../css/utils/darkmode.css";
import "../css/utils/animations.css";

import "../css/main.css";

import busdata from "./data/busdata.js";
import { getDateType } from "./data/calendar.js";

document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const headerText = document.querySelector(".header_text");
  const darkModeBtn = document.querySelector(".header__icon--dark");
  const refreshBtn = document.querySelector(".header__icon--ref");

  const firstInfoText = document.querySelector(".info-text--primary");
  const secondInfoText = document.querySelector(".info-text--secondary");

  const firstTable = document.querySelector(".timetable__preview--primary");
  const firstAllTable = document.querySelector(".timetable__all--primary");
  const firstTableBtn = document.querySelector(".timetable__toggle--primary");

  const secondTable = document.querySelector(".timetable__preview--secondary");
  const secondAllTable = document.querySelector(".timetable__all--secondary");
  const secondTableBtn = document.querySelector(
    ".timetable__toggle--secondary"
  );

  const busScheduleLink = document.querySelector(".nav__menu__btn--schedule");
  const busRouteLink = document.querySelector(".nav__menu__btn--route");

  const weekdaysLink = document.querySelector(".nav__menu__btn--weekdays");
  const weekendLink = document.querySelector(".nav__menu__btn--weekend");
  const vacationLink = document.querySelector(".nav__menu__btn--vacation");

  const footerDate = document.querySelector(".footer__text__date");

  // URL 기본 경로
  const urlBase =
    "https://www.miryang.go.kr/docviewer/index.jsp?atchFileId=FILE_";

  // 시간표 노선도 링크 [평일, 주말 방학]
  const links = {
    weekdays: {
      timetable: `${urlBase}000000000076490&fileSn=1&fileName=BBS_202501060246536911&fileSn=1&docName=1`,
      route: `${urlBase}000000000057458&fileSn=5&fileName=BBS_202309070216369885&fileSn=5&docName=bus-every-20230907`,
    },
    weekend: {
      timetable: `${urlBase}000000000076490&fileSn=0&fileName=BBS_202501060246536840&fileSn=0&docName=2`,
      route: `${urlBase}000000000057458&fileSn=0&fileName=BBS_202308210915280290&fileSn=0&docName=bus20230821-1`,
    },
    vacation: {
      timetable: `${urlBase}000000000076490&fileSn=0&fileName=BBS_202501060246536840&fileSn=0&docName=2`,
      route: `${urlBase}000000000057458&fileSn=0&fileName=BBS_202308210915280290&fileSn=0&docName=bus20230821-1`,
    },
  };

  let currentMode = ""; // [평일, 주말, 방학]

  let cam2sta = busdata.weekdayscam2sta;
  let sta2cam = busdata.weekdayssta2cam;

  let showFirstAllTable = false;
  let showSecondAllTable = false;

  let refreshTime = null;
  let minuteTime = null;
  let oneSecondRefreshTime = null;
  let isRefreshing = false;
  let refreshCount = 0;

  // hidden all table
  if (firstAllTable) firstAllTable.style.display = "none";
  if (secondAllTable) secondAllTable.style.display = "none";

  // darkmode seeting
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled" && darkModeBtn) {
    body.classList.add("dark-mode");
    darkModeBtn.classList.remove("fa-moon");
    darkModeBtn.classList.add("fa-sun");
  }

  // setting date settingDate
  function settingDate() {
    const today = new Date();
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdayNames[today.getDay()];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    return {
      today,
      dateString: `${year}년 ${month}월 ${date}일 (${dayOfWeek})`,
      dayOfWeek,
    };
  }

  // time convert [h:m:s -> m]
  function timeConvert(minutes) {
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

  // mode: UI, data upadate
  function setMode(mode) {
    currentMode = mode;

    if (weekdaysLink) weekdaysLink.classList.remove("active");
    if (weekendLink) weekendLink.classList.remove("active");
    if (vacationLink) vacationLink.classList.remove("active");

    if (mode === "weekdays") {
      if (weekdaysLink) weekdaysLink.classList.add("active");
      cam2sta = busdata.weekdayscam2sta;
      sta2cam = busdata.weekdayssta2cam;
    } else if (mode === "weekend") {
      if (weekendLink) weekendLink.classList.add("active");
      cam2sta = busdata.weekendcam2sta;
      sta2cam = busdata.weekendsta2cam;
    } else if (mode === "vacation") {
      if (vacationLink) vacationLink.classList.add("active");
      cam2sta = busdata.vacationcam2sta;
      sta2cam = busdata.vacationsta2cam;
    }

    updateLinks(currentMode);
    updateCell();
    resetBusTable();

    const { dateString } = settingDate();
    const modeText = {
      weekdays: "평일",
      weekend: "주말·공휴일",
      vacation: "방학",
    };

    if (headerText) {
      headerText.innerHTML = `${modeText[mode]}  <span class="date-text">${dateString}</span>`;
    }
  }

  // auto change mode by date
  function autoDetectMode() {
    const { today, dateString } = settingDate();
    const dateType = getDateType(today);

    if (footerDate) {
      footerDate.textContent = dateString;
    }

    if (dateType === "vacation") {
      setMode("vacation");
    } else if (dateType === "weekend") {
      setMode("weekend");
    } else {
      setMode("weekdays");
    }
  }

  // calculate remain recent bus time
  function calculateBusInfo(bus, currentTime, currentSeconds) {
    if (!bus || !bus.depart) return { imminent: false, text: "" };

    const [hour, minute] = bus.depart.split(":").map(Number);
    const busTime = hour * 60 + minute;
    const diffMinutes = busTime - currentTime;

    if (diffMinutes <= 0 || (diffMinutes === 1 && currentSeconds > 0)) {
      const remainingSeconds = 60 - currentSeconds;
      return {
        imminent: true,
        text: `<span class="time-highlight">${remainingSeconds}초</span> 후 출발 (${bus.depart})`,
      };
    } else {
      const formattedTime = timeConvert(diffMinutes);
      return {
        imminent: false,
        text: `<span class="time-highlight">${formattedTime}</span> 후 출발 (${bus.depart})`,
      };
    }
  }

  // update bustable by time
  function busTables() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // 두 노선의 다음 버스 필터링
    const nextCam2sta = cam2sta.filter((bus) => {
      if (!bus.depart) return false;
      const [hour, minute] = bus.depart.split(":").map(Number);
      const departTime = hour * 60 + minute;
      return departTime >= currentTime;
    });

    const nextSta2cam = sta2cam.filter((bus) => {
      if (!bus.depart) return false;
      const [hour, minute] = bus.depart.split(":").map(Number);
      const departTime = hour * 60 + minute;
      return departTime >= currentTime;
    });

    // 테이블 및 정보 업데이트
    updateMainTable(nextCam2sta, firstTable, true);
    updateMainTable(nextSta2cam, secondTable, false);
    updateAllTable(cam2sta, firstAllTable, true);
    updateAllTable(sta2cam, secondAllTable, false);
    updateInformText(nextCam2sta, nextSta2cam, currentTime);
  }

  // main table update
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

  // all bus table update
  function updateAllTable(data, table, isRoute1) {
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

  // info text update
  function updateInformText(route1Data, route2Data, currentTime) {
    try {
      const now = new Date();
      const currentSeconds = now.getSeconds();
      let busImminent = false;

      // 첫 번째 노선 처리 (부산대 → 밀양역)
      if (route1Data.length > 0 && firstInfoText) {
        const firstBus = route1Data[0];
        const nextBus = route1Data.length > 1 ? route1Data[1] : null;

        const firstBusInfo = calculateBusInfo(
          firstBus,
          currentTime,
          currentSeconds
        );
        busImminent = busImminent || firstBusInfo.imminent;

        let text = `부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 ${firstBusInfo.text}`;

        if (nextBus) {
          const nextBusInfo = calculateBusInfo(
            nextBus,
            currentTime,
            currentSeconds
          );
          busImminent = busImminent || nextBusInfo.imminent;
          text += `<br /> 다음 버스 ${nextBusInfo.text}`;
        }

        firstInfoText.innerHTML = text;
      } else if (firstInfoText) {
        firstInfoText.innerHTML =
          '부산대 <i class="fa-solid fa-arrow-right"></i> 밀양역 금일 운행 예정 버스 없음.';
      }

      // 두 번째 노선 처리 (밀양역 → 부산대)
      if (route2Data.length > 0 && secondInfoText) {
        const firstBus = route2Data[0];
        const nextBus = route2Data.length > 1 ? route2Data[1] : null;

        const firstBusInfo = calculateBusInfo(
          firstBus,
          currentTime,
          currentSeconds
        );
        busImminent = busImminent || firstBusInfo.imminent;

        let text = `밀양역 <i class="fa-solid fa-arrow-right"></i> 부산대 ${firstBusInfo.text}`;

        if (nextBus) {
          const nextBusInfo = calculateBusInfo(
            nextBus,
            currentTime,
            currentSeconds
          );
          busImminent = busImminent || nextBusInfo.imminent;
          text += `<br /> 다음 버스 ${nextBusInfo.text}`;
        }

        secondInfoText.innerHTML = text;
      } else if (secondInfoText) {
        secondInfoText.innerHTML =
          '밀양역 <i class="fa-solid fa-arrow-right"></i> 부산대 금일 운행 예정 버스 없음.';
      }

      // 임박도에 따른 리프레시 설정 - 버스 출발이 임박하면 1초 간격으로 갱신
      if (busImminent) {
        enableOneSecondRefresh();
      } else {
        disableOneSecondRefresh();
      }
    } catch (error) {
      console.error("시간 업데이트 오류:", error);
    }
  }

  // refresh setting
  function manageRefreshTimers(callback, rate) {
    stopAllRefreshTimers();

    if (rate === "second") {
      oneSecondRefreshTime = setInterval(callback, 1000);
    } else if (rate === "minute") {
      const now = new Date();
      const seconds = now.getSeconds();
      const millisToNextMinute = (60 - seconds) * 1000;

      setTimeout(() => {
        callback();
        minuteTime = setInterval(callback, 60000);
      }, millisToNextMinute);
    } else if (rate === "initial") {
      callback();
      refreshTime = setInterval(() => {
        callback();
        refreshCount++;

        if (refreshCount >= 4) {
          stopRefreshTimers("initial");
          manageRefreshTimers(callback, "minute");
        }
      }, 5000);
    }
  }

  // refresh stop
  function stopRefreshTimers(type) {
    if (type === "all" || type === "initial") {
      if (refreshTime) {
        clearInterval(refreshTime);
        refreshTime = null;
      }
    }

    if (type === "all" || type === "minute") {
      if (minuteTime) {
        clearInterval(minuteTime);
        minuteTime = null;
      }
    }

    if (type === "all" || type === "second") {
      if (oneSecondRefreshTime) {
        clearInterval(oneSecondRefreshTime);
        oneSecondRefreshTime = null;
      }
    }
  }

  //all refresh able
  function stopAllRefreshTimers() {
    stopRefreshTimers("all");
  }

  // one sec ref active
  function enableOneSecondRefresh() {
    if (oneSecondRefreshTime) return;
    manageRefreshTimers(updateCell, "second");
  }

  // on sec ref disable
  function disableOneSecondRefresh() {
    if (!oneSecondRefreshTime) return;

    stopRefreshTimers("second");

    if (isRefreshing && !refreshTime && !minuteTime) {
      const now = new Date();
      const seconds = now.getSeconds();

      if (seconds < 55) {
        manageRefreshTimers(updateCell, "initial");
      } else {
        manageRefreshTimers(updateCell, "minute");
      }
    }
  }

  // auto ref
  function autoRefresh() {
    stopAllRefreshTimers();
    if (refreshBtn) refreshBtn.classList.add("rotating");
    isRefreshing = true;
    refreshCount = 0;
    manageRefreshTimers(updateCell, "initial");
  }

  // auto ref - button
  function toggleRefresh() {
    if (isRefreshing) {
      stopAllRefreshTimers();
      if (refreshBtn) refreshBtn.classList.remove("rotating");
      isRefreshing = false;
    } else {
      autoRefresh();
    }
  }

  // 버튼 텍스트 업데이트 함수 - 테이블 접기/펼치기
  function updateButtonText() {
    if (firstTableBtn) {
      firstTableBtn.textContent = showFirstAllTable
        ? "접기"
        : "전체 시간표 보기";
    }
    if (secondTableBtn) {
      secondTableBtn.textContent = showSecondAllTable
        ? "접기"
        : "전체 시간표 보기";
    }
  }

  // bustable update
  function updateCell() {
    busTables();
  }

  // reset bustable
  function resetBusTable() {
    showFirstAllTable = false;
    showSecondAllTable = false;
    if (firstAllTable) firstAllTable.style.display = "none";
    if (secondAllTable) secondAllTable.style.display = "none";
    if (firstTable) firstTable.style.display = "block";
    if (secondTable) secondTable.style.display = "block";
    updateButtonText();
  }

  // cheak date change
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

  // nav link update
  function updateLinks(mode) {
    if (busScheduleLink && busRouteLink && links[mode]) {
      busScheduleLink.onclick = function () {
        window.location.href = links[mode].timetable;
      };

      busRouteLink.onclick = function () {
        window.location.href = links[mode].route;
      };
    }
  }

  // private email
  function privateEmail() {
    const emailElement = document.querySelector(".footer__text--contact");
    if (!emailElement) return;

    const parts = {
      front: atob("aW1wbGFudC5zdGFmZmVyNzQ="),
    };

    const fullEmail = `${parts.front}@icloud.com`;
    emailElement.textContent = fullEmail;
    emailElement.removeAttribute("href");

    emailElement.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = `mailto:${fullEmail}`;
    });

    emailElement.style.cursor = "pointer";
  }

  // darkmode btn
  if (darkModeBtn) {
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
  }

  // frist all time bus table
  if (firstTableBtn) {
    firstTableBtn.addEventListener("click", function () {
      showFirstAllTable = !showFirstAllTable;
      if (firstAllTable)
        firstAllTable.style.display = showFirstAllTable ? "block" : "none";
      if (firstTable)
        firstTable.style.display = showFirstAllTable ? "none" : "block";
      updateButtonText();
    });
  }

  // second all time bus table
  if (secondTableBtn) {
    secondTableBtn.addEventListener("click", function () {
      showSecondAllTable = !showSecondAllTable;
      if (secondAllTable)
        secondAllTable.style.display = showSecondAllTable ? "block" : "none";
      if (secondTable)
        secondTable.style.display = showSecondAllTable ? "none" : "block";
      updateButtonText();
    });
  }

  // ref btn
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      toggleRefresh();
    });
  }

  // weekdays link
  if (weekdaysLink) {
    weekdaysLink.addEventListener("click", function (event) {
      event.preventDefault();
      setMode("weekdays");
    });
  }

  // weekend link
  if (weekendLink) {
    weekendLink.addEventListener("click", function (event) {
      event.preventDefault();
      setMode("weekend");
    });
  }

  // vacation link
  if (vacationLink) {
    vacationLink.addEventListener("click", function (event) {
      event.preventDefault();
      setMode("vacation");
    });
  }
  // display bus table error
  if (!busdata || !busdata.weekdayscam2sta || !busdata.weekdayssta2cam) {
    if (firstInfoText) {
      firstInfoText.innerText =
        "부산대 → 밀양역: 데이터를 불러오지 못했습니다.";
    }
    if (secondInfoText) {
      secondInfoText.innerText =
        "밀양역 → 부산대: 데이터를 불러오지 못했습니다.";
    }
    return;
  }

  autoDetectMode(); // date detect
  updateButtonText(); // btn text init
  autoRefresh(); // auto ref
  checkDateChange(); // date change detect
  privateEmail(); // private email
});
