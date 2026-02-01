class Stopwatch {
  constructor() {
    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animationId = null;
    this.laps = [];

    // DOM Elements
    this.minutesEl = document.getElementById("minutes");
    this.secondsEl = document.getElementById("seconds");
    this.millisecondsEl = document.getElementById("milliseconds");
    this.startStopBtn = document.getElementById("start-stop");
    this.lapResetBtn = document.getElementById("lap-reset");
    this.lapsListEl = document.getElementById("laps-list");
    this.progressCircle = document.querySelector(".progress-ring__circle");

    // Progress ring setup
    this.circumference = 2 * Math.PI * 130;
    this.progressCircle.style.strokeDasharray = `${this.circumference}`;
    this.progressCircle.style.strokeDashoffset = `${this.circumference}`;

    this.init();
  }

  init() {
    this.startStopBtn.addEventListener("click", () => this.toggleStartStop());
    this.lapResetBtn.addEventListener("click", () => this.handleLapReset());
  }

  toggleStartStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.isRunning = true;
    this.startTime = Date.now() - this.elapsedTime;
    this.startStopBtn.textContent = "停止";
    this.startStopBtn.classList.add("running");
    this.lapResetBtn.disabled = false;
    this.lapResetBtn.textContent = "计次";
    this.update();
  }

  stop() {
    this.isRunning = false;
    this.startStopBtn.textContent = "继续";
    this.startStopBtn.classList.remove("running");
    this.lapResetBtn.textContent = "复位";
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  handleLapReset() {
    if (this.isRunning) {
      this.lap();
    } else {
      this.reset();
    }
  }

  lap() {
    const lapTime = this.elapsedTime;
    const previousLapTime = this.laps.length > 0 ? this.laps[0].total : 0;
    const diff = lapTime - previousLapTime;

    this.laps.unshift({
      number: this.laps.length + 1,
      total: lapTime,
      diff: diff,
    });

    this.renderLaps();
  }

  reset() {
    this.elapsedTime = 0;
    this.laps = [];
    this.updateDisplay(0);
    this.updateProgress(0);
    this.startStopBtn.textContent = "开始";
    this.lapResetBtn.disabled = true;
    this.lapResetBtn.textContent = "复位";
    this.lapsListEl.innerHTML = "";
  }

  update() {
    if (!this.isRunning) return;

    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay(this.elapsedTime);
    this.updateProgress(this.elapsedTime);

    this.animationId = requestAnimationFrame(() => this.update());
  }

  updateDisplay(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    this.minutesEl.textContent = minutes.toString().padStart(2, "0");
    this.secondsEl.textContent = seconds.toString().padStart(2, "0");
    this.millisecondsEl.textContent = milliseconds.toString().padStart(2, "0");
  }

  updateProgress(time) {
    // Progress completes every 60 seconds
    const progress = (time % 60000) / 60000;
    const offset = this.circumference * (1 - progress);
    this.progressCircle.style.strokeDashoffset = offset;
  }

  formatTime(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }

  renderLaps() {
    if (this.laps.length < 2) {
      this.lapsListEl.innerHTML = this.laps
        .map(
          (lap) => `
        <li class="lap-item">
          <span class="lap-number">计次 ${lap.number}</span>
          <span class="lap-time">${this.formatTime(lap.diff)}</span>
        </li>
      `,
        )
        .join("");
      return;
    }

    const diffs = this.laps.map((l) => l.diff);
    const fastest = Math.min(...diffs);
    const slowest = Math.max(...diffs);

    this.lapsListEl.innerHTML = this.laps
      .map((lap) => {
        let className = "lap-item";
        if (lap.diff === fastest) className += " fastest";
        else if (lap.diff === slowest) className += " slowest";

        return `
        <li class="${className}">
          <span class="lap-number">计次 ${lap.number}</span>
          <span class="lap-time">${this.formatTime(lap.diff)}</span>
        </li>
      `;
      })
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Stopwatch();
});
