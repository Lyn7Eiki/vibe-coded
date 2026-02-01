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

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    this.currentTimeEl.textContent = timeStr;
  }

  renderAlarms() {
    this.listEl.innerHTML = "";
    if (this.alarms.length === 0) {
      this.listEl.innerHTML =
        '<li style="text-align:center; color:rgba(255,255,255,0.3); padding-top:20px;">暂无闹钟</li>';
      return;
    }

    this.alarms.forEach((alarm, index) => {
      const li = document.createElement("li");
      li.className = "alarm-item";
      // Use local terminology for status if needed, but On/Off toggle is visual.
      // We'll keep the text minimal "开启" "关闭" if we want, or just rely on global switch.
      // Let's use Chinese for the secondary text.
      const statusText = alarm.isActive ? "已开启" : "已关闭";

      li.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-time">
                        ${alarm.h.toString().padStart(2, "0")}:${alarm.m.toString().padStart(2, "0")}
                    </div>
                    <div class="alarm-label">
                     ${statusText}
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" ${alarm.isActive ? "checked" : ""} data-index="${index}">
                    <span class="slider"></span>
                </label>
            `;

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
