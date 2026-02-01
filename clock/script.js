class VibeClock {
  constructor() {
    this.hoursEl = document.getElementById("hours");
    this.minutesEl = document.getElementById("minutes");
    this.secondsEl = document.getElementById("seconds");
    this.ampmEl = document.getElementById("ampm");
    this.dateEl = document.getElementById("date");
    this.formatToggleBtn = document.getElementById("format-toggle");

    this.is24Hour = localStorage.getItem("vibeClock_is24Hour") === "true";

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.updateFormatButton();
  }

  setupEventListeners() {
    this.formatToggleBtn.addEventListener("click", () => {
      this.is24Hour = !this.is24Hour;
      localStorage.setItem("vibeClock_is24Hour", this.is24Hour);
      this.updateFormatButton();
      this.updateClock();
    });
  }

  updateFormatButton() {
    this.formatToggleBtn.textContent = this.is24Hour ? "12小时制" : "24小时制";
    this.ampmEl.style.display = this.is24Hour ? "none" : "inline-block";
  }

  updateClock() {
    const now = new Date();

    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    let ampm = "";

    if (!this.is24Hour) {
      ampm = this.getTimePeriod(h);
      h = h % 12;
      h = h ? h : 12;
    }

    this.hoursEl.textContent = this.pad(h);
    this.minutesEl.textContent = this.pad(m);
    this.secondsEl.textContent = this.pad(s);
    this.ampmEl.textContent = ampm;

    // Date Format: Chinese
    const options = { weekday: "long", month: "long", day: "numeric" };
    this.dateEl.textContent = now.toLocaleDateString("zh-CN", options);
  }

  getTimePeriod(hour) {
    if (hour >= 1 && hour <= 5) return "凌晨";
    if (hour >= 6 && hour <= 9) return "早上";
    if (hour >= 10 && hour <= 11) return "上午";
    if (hour === 12) return "中午";
    if (hour >= 13 && hour <= 18) return "下午";
    // 19-23 and 0 (which is 24)
    return "晚上";
  }

  pad(num) {
    return num.toString().padStart(2, "0");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeClock();
});
