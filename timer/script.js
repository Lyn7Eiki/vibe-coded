class Timer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.intervalId = null;

    // DOM Elements
    this.timePicker = document.getElementById("time-picker");
    this.countdownDisplay = document.getElementById("countdown-display");
    this.inputH = document.getElementById("input-h");
    this.inputM = document.getElementById("input-m");
    this.inputS = document.getElementById("input-s");
    this.hoursEl = document.getElementById("hours");
    this.minutesEl = document.getElementById("minutes");
    this.secondsEl = document.getElementById("seconds");
    this.startPauseBtn = document.getElementById("start-pause");
    this.cancelBtn = document.getElementById("cancel");
    this.quickBtns = document.querySelectorAll(".quick-btn");
    this.progressCircle = document.querySelector(".progress-ring__circle");
    this.ringOverlay = document.getElementById("ring-overlay");
    this.stopAlarmBtn = document.getElementById("stop-alarm");

    // Audio
    this.audioCtx = null;
    this.ringInterval = null;

    // Progress ring setup
    this.circumference = 2 * Math.PI * 130;
    this.progressCircle.style.strokeDasharray = `${this.circumference}`;

    this.init();
  }

  init() {
    this.startPauseBtn.addEventListener("click", () => this.handleStartPause());
    this.cancelBtn.addEventListener("click", () => this.cancel());
    this.stopAlarmBtn.addEventListener("click", () => this.stopAlarm());

    this.quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const seconds = parseInt(btn.dataset.time);
        this.setQuickTime(seconds);
      });
    });
  }

  setQuickTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    this.inputH.value = h.toString().padStart(2, "0");
    this.inputM.value = m.toString().padStart(2, "0");
    this.inputS.value = s.toString().padStart(2, "0");
  }

  handleStartPause() {
    if (!this.isRunning) {
      this.start();
    } else if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  start() {
    const h = parseInt(this.inputH.value) || 0;
    const m = parseInt(this.inputM.value) || 0;
    const s = parseInt(this.inputS.value) || 0;

    this.totalSeconds = h * 3600 + m * 60 + s;
    if (this.totalSeconds <= 0) return;

    this.remainingSeconds = this.totalSeconds;
    this.isRunning = true;
    this.isPaused = false;

    this.timePicker.classList.add("hidden");
    this.countdownDisplay.classList.remove("hidden");

    this.updateDisplay();
    this.updateProgress();

    this.startPauseBtn.textContent = "暂停";
    this.startPauseBtn.classList.add("paused");
    this.cancelBtn.disabled = false;

    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  pause() {
    this.isPaused = true;
    this.startPauseBtn.textContent = "继续";
    this.startPauseBtn.classList.remove("paused");
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  resume() {
    this.isPaused = false;
    this.startPauseBtn.textContent = "暂停";
    this.startPauseBtn.classList.add("paused");
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  cancel() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.timePicker.classList.remove("hidden");
    this.countdownDisplay.classList.add("hidden");

    this.startPauseBtn.textContent = "开始";
    this.startPauseBtn.classList.remove("paused");
    this.cancelBtn.disabled = true;

    this.progressCircle.style.strokeDashoffset = 0;
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();
      this.updateProgress();
    }

    if (this.remainingSeconds <= 0) {
      this.complete();
    }
  }

  updateDisplay() {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;

    this.hoursEl.textContent = h.toString().padStart(2, "0");
    this.minutesEl.textContent = m.toString().padStart(2, "0");
    this.secondsEl.textContent = s.toString().padStart(2, "0");
  }

  updateProgress() {
    const progress = this.remainingSeconds / this.totalSeconds;
    const offset = this.circumference * (1 - progress);
    this.progressCircle.style.strokeDashoffset = offset;
  }

  complete() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.ringOverlay.classList.remove("hidden");
    void this.ringOverlay.offsetWidth;
    this.ringOverlay.classList.add("visible");

    this.startSound();
  }

  stopAlarm() {
    this.ringOverlay.classList.remove("visible");
    setTimeout(() => this.ringOverlay.classList.add("hidden"), 300);
    this.stopSound();
    this.cancel();
  }

  startSound() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
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
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Timer();
});
