class VibeAlarm {
  constructor() {
    this.alarms = JSON.parse(localStorage.getItem("vibeAlarms")) || [];

    // DOM Elements
    this.listEl = document.getElementById("alarm-list");
    this.addBtn = document.getElementById("add-btn");
    this.modal = document.getElementById("alarm-modal");
    this.cancelBtn = document.getElementById("cancel-alarm");
    this.saveBtn = document.getElementById("save-alarm");
    this.inputH = document.getElementById("alarm-h");
    this.inputM = document.getElementById("alarm-m");

    this.ringOverlay = document.getElementById("ring-overlay");
    this.ringTimePrg = document.getElementById("ring-time");
    this.stopBtn = document.getElementById("stop-alarm");

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.isRinging = false;
    this.ringInterval = null;

    this.init();
  }

  init() {
    this.renderAlarms();
    this.setupEventListeners();

    setInterval(() => {
      this.checkAlarms();
    }, 1000);
  }

  setupEventListeners() {
    this.addBtn.addEventListener("click", () => {
      this.openModal();
    });

    this.cancelBtn.addEventListener("click", () => {
      this.closeModal();
    });

    this.saveBtn.addEventListener("click", () => {
      this.saveAlarm();
    });

    this.stopBtn.addEventListener("click", () => {
      this.stopAlarm();
    });

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  renderAlarms() {
    this.listEl.innerHTML = "";
    if (this.alarms.length === 0) {
      this.listEl.innerHTML = `
        <li class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <p>暂无闹钟，点击下方按钮添加</p>
        </li>`;
      return;
    }

    this.alarms.forEach((alarm, index) => {
      const li = document.createElement("li");
      li.className = "alarm-item";
      const statusText = alarm.isActive ? "已开启" : "已关闭";

      li.innerHTML = `
        <div class="alarm-info">
          <div class="alarm-time">
            ${alarm.h.toString().padStart(2, "0")}:${alarm.m.toString().padStart(2, "0")}
          </div>
          <div class="alarm-label">${statusText}</div>
        </div>
        <div class="alarm-actions">
          <label class="switch">
            <input type="checkbox" ${alarm.isActive ? "checked" : ""} data-index="${index}">
            <span class="slider"></span>
          </label>
          <button class="delete-btn" data-index="${index}" aria-label="删除闹钟">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      `;

      li.querySelector("input").addEventListener("change", (e) => {
        this.toggleAlarm(index, e.target.checked);
      });

      li.querySelector(".delete-btn").addEventListener("click", () => {
        this.deleteAlarm(index);
      });

      this.listEl.appendChild(li);
    });
  }

  toggleAlarm(index, isActive) {
    this.alarms[index].isActive = isActive;
    this.saveToStorage();
    this.renderAlarms();
  }

  deleteAlarm(index) {
    if (confirm("确定要删除这个闹钟吗？")) {
      this.alarms.splice(index, 1);
      this.saveToStorage();
      this.renderAlarms();
    }
  }

  openModal() {
    const now = new Date();
    this.inputH.value = now.getHours().toString().padStart(2, "0");
    this.inputM.value = now.getMinutes().toString().padStart(2, "0");

    this.modal.classList.remove("hidden");
    void this.modal.offsetWidth;
    this.modal.classList.add("visible");
  }

  closeModal() {
    this.modal.classList.remove("visible");
    setTimeout(() => {
      this.modal.classList.add("hidden");
    }, 300);
  }

  saveAlarm() {
    let h = parseInt(this.inputH.value);
    let m = parseInt(this.inputM.value);

    if (isNaN(h) || h < 0 || h > 23) h = 0;
    if (isNaN(m) || m < 0 || m > 59) m = 0;

    this.alarms.push({
      h,
      m,
      isActive: true,
      id: Date.now(),
    });

    this.saveToStorage();
    this.closeModal();
    this.renderAlarms();
  }

  saveToStorage() {
    localStorage.setItem("vibeAlarms", JSON.stringify(this.alarms));
  }

  checkAlarms() {
    if (this.isRinging) return;

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    if (s !== 0) return;

    const matchingAlarm = this.alarms.find(
      (a) => a.isActive && a.h === h && a.m === m,
    );

    if (matchingAlarm) {
      this.triggerAlarm(matchingAlarm);
    }
  }

  triggerAlarm(alarm) {
    this.isRinging = true;
    this.ringOverlay.classList.remove("hidden");
    void this.ringOverlay.offsetWidth;
    this.ringOverlay.classList.add("visible");

    this.ringTimePrg.textContent = `${alarm.h.toString().padStart(2, "0")}:${alarm.m.toString().padStart(2, "0")}`;

    this.startSound();
  }

  stopAlarm() {
    this.isRinging = false;
    this.ringOverlay.classList.remove("visible");
    setTimeout(() => this.ringOverlay.classList.add("hidden"), 300);
    this.stopSound();
  }

  startSound() {
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    const playBeep = () => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioCtx.currentTime + 0.5,
      );
      osc.stop(this.audioCtx.currentTime + 0.5);
    };

    playBeep();
    this.ringInterval = setInterval(() => {
      playBeep();
    }, 1000);
  }

  stopSound() {
    if (this.ringInterval) clearInterval(this.ringInterval);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeAlarm();
});
