class PomodoroClock {
  constructor() {
    // DOM Elements
    this.minEl = document.getElementById("minutes");
    this.secEl = document.getElementById("seconds");
    this.startPauseBtn = document.getElementById("start-pause");
    this.resetBtn = document.getElementById("reset");
    this.circle = document.querySelector(".progress-ring__circle");
    this.modeBtns = document.querySelectorAll(".mode-btn");
    this.pomodoroCountEl = document.getElementById("pomodoro-count");
    this.appBackground = document.querySelector(".app-background");

    // Constants
    this.MODES = {
      pomodoro: { time: 25, color: "hsl(0, 90%, 65%)" },
      shortBreak: { time: 5, color: "hsl(170, 75%, 45%)" },
      longBreak: { time: 15, color: "hsl(210, 85%, 60%)" },
    };

    // State
    this.currentMode = "pomodoro";
    this.timeLeft = this.MODES[this.currentMode].time * 60;
    this.totalTime = this.timeLeft;
    this.isRunning = false;
    this.timerId = null;
    this.pomodorosCompleted = 0;

    // Audio
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // SVG Circle Setup
    this.radius = this.circle.r.baseVal.value;
    this.circumference = 2 * Math.PI * this.radius;

    // Init
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDisplay();
    this.updateTheme();

    // Handle responsive circle size if needed on load
    this.updateCircleSize();
    window.addEventListener("resize", () => {
      this.updateCircleSize();
      this.setProgress(this.timeLeft / this.totalTime);
    });
  }

  updateCircleSize() {
    // Recalculate based on current SVG radius (responsive CSS might change it)
    // Accessing the live DOM element specifically
    const computedStyle = window.getComputedStyle(this.circle);
    // Note: r value is an attribute, but if CSS changes the layout, we might need to rely on the attribute logic used in HTML
    // For this simple implementation, the CSS media query adjusts r attribute implicitly by replacing the ring logic or we just trust the initial calc.
    // Actually, CSS media query used specific R values, we need to respect that.

    // Simple fix for responsive: read the attribute again if we were dynamically setting it, but here we just rely on the constant math
    // because the JS doesn't "know" CSS meda queries changed the Radius attribute unless we set it.
    // We will assume the radius in JS matches the generic desktop init or add a check.
    if (window.innerWidth <= 400) {
      this.radius = 115;
    } else {
      this.radius = 140;
    }
    this.circumference = 2 * Math.PI * this.radius;
    this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.style.strokeDashoffset = this.circumference;
    // set initial
    this.setProgress(this.timeLeft / this.totalTime);
  }

  setupEventListeners() {
    this.startPauseBtn.addEventListener("click", () => this.toggleTimer());
    this.resetBtn.addEventListener("click", () => this.resetTimer());

    this.modeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = e.target.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  switchMode(mode) {
    if (
      this.currentMode === mode &&
      !this.isRunning &&
      this.timeLeft === this.MODES[mode].time * 60
    )
      return;

    this.currentMode = mode;
    this.pauseTimer(); // Stop if running

    // Update state
    this.timeLeft = this.MODES[mode].time * 60;
    this.totalTime = this.timeLeft;

    // Update UI
    this.updateDisplay();
    this.updateTheme();
    this.setProgress(1); // Full circle

    // Update Buttons
    this.modeBtns.forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");

    this.startPauseBtn.textContent = "开始";
  }

  updateTheme() {
    const color = this.MODES[this.currentMode].color;
    document.documentElement.style.setProperty("--current-color", color);

    // Update controls color explicitly if needed (CSS variable handles most)
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.timeLeft <= 0) return;

    this.isRunning = true;
    this.startPauseBtn.textContent = "暂停";
    this.playBeep(440, 0.1); // Start feedback

    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      this.setProgress(this.timeLeft / this.totalTime);

      if (this.timeLeft <= 0) {
        this.completeTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    this.startPauseBtn.textContent = "继续";
    clearInterval(this.timerId);
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.MODES[this.currentMode].time * 60;
    this.updateDisplay();
    this.setProgress(1);
    this.startPauseBtn.textContent = "开始";
  }

  completeTimer() {
    this.pauseTimer();
    this.startPauseBtn.textContent = "完成";

    // Determine action based on mode
    if (this.currentMode === "pomodoro") {
      this.pomodorosCompleted++;
      this.pomodoroCountEl.textContent = this.pomodorosCompleted;
      this.playMelody("success");
      // Auto switch could be implemented here, but manual is often preferred for control
    } else {
      this.playMelody("notify");
      // Switch back to pomodoro automatically? Or let user decide.
      // Let's just notify.
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    this.minEl.textContent = minutes.toString().padStart(2, "0");
    this.secEl.textContent = seconds.toString().padStart(2, "0");

    // document.title = `(${timeString}) Focus Flow`;
  }

  setProgress(percent) {
    // percent is 0 to 1
    const offset = this.circumference - percent * this.circumference;
    this.circle.style.strokeDashoffset = offset;
  }

  // Sound Engine using Web Audio API (No files needed)
  playBeep(freq = 440, duration = 0.1, type = "sine") {
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioCtx.currentTime + duration,
    );

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playMelody(type) {
    if (type === "success") {
      const now = this.audioCtx.currentTime;
      this.playNote(523.25, now, 0.1); // C5
      this.playNote(659.25, now + 0.1, 0.1); // E5
      this.playNote(783.99, now + 0.2, 0.2); // G5
      this.playNote(1046.5, now + 0.4, 0.4); // C6
    } else {
      const now = this.audioCtx.currentTime;
      this.playNote(440, now, 0.1);
      this.playNote(440, now + 0.2, 0.3);
    }
  }

  playNote(freq, time, duration) {
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + duration);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const clock = new PomodoroClock();
});
