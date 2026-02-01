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
    this.currentTimeEl = document.getElementById("current-time");

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

    // Clock loop
    setInterval(() => {
      this.updateClock();
      this.checkAlarms();
    }, 1000);
    this.updateClock();
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

    // Close modal on outside click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    this.currentTimeEl.textContent = timeStr;
  }

  renderAlarms() {
    this.listEl.innerHTML = "";
    this.alarms.forEach((alarm, index) => {
      const li = document.createElement("li");
      li.className = "alarm-item";
      li.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-time">
                        ${alarm.h.toString().padStart(2, "0")}:${alarm.m.toString().padStart(2, "0")}
                    </div>
                    <div class="alarm-label">
                     ${alarm.isActive ? "On" : "Off"}
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" ${alarm.isActive ? "checked" : ""} data-index="${index}">
                    <span class="slider"></span>
                </label>
            `;

      // Delete on long press or button (simplified: just toggle for now, maybe add delete button)
      // For simplicity, let's just create a delete btn
      // Actually, let's keep it simple: Toggle wraps functionality.
      // A long press could delete, but let's add a small x button

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "×";
      deleteBtn.style.cssText =
        "background:none;border:none;color:#666;font-size:24px;margin-left:15px;cursor:pointer;";
      deleteBtn.onclick = () => this.deleteAlarm(index);
      li.appendChild(deleteBtn);

      li.querySelector("input").addEventListener("change", (e) => {
        this.toggleAlarm(index, e.target.checked);
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
    this.alarms.splice(index, 1);
    this.saveToStorage();
    this.renderAlarms();
  }

  openModal() {
    const now = new Date();
    this.inputH.value = now.getHours().toString().padStart(2, "0");
    this.inputM.value = now.getMinutes().toString().padStart(2, "0");

    this.modal.classList.remove("hidden");
    // Force reflow
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

    // Validation
    if (isNaN(h) || h < 0 || h > 23) h = 0;
    if (isNaN(m) || m < 0 || m > 59) m = 0;

    this.alarms.push({
      h,
      m,
      isActive: true,
      id: Date.now(), // unique ID for tracking ring state if needed
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

    if (s !== 0) return; // Only check on the minute mark

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

  // Audio Engine
  startSound() {
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    const playBeep = () => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.frequency.value = 880; // A5
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
    }, 1000); // Beep every second
  }

  stopSound() {
    if (this.ringInterval) clearInterval(this.ringInterval);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeAlarm();
});
