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
    this.updateClock(); // Immediate update
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
    this.formatToggleBtn.textContent = this.is24Hour ? "12H Mode" : "24H Mode";
    this.ampmEl.style.display = this.is24Hour ? "none" : "inline-block";
  }

  updateClock() {
    const now = new Date();

    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    let ampm = "";

    if (!this.is24Hour) {
      ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12; // 0 should be 12
    }

    this.hoursEl.textContent = this.pad(h);
    this.minutesEl.textContent = this.pad(m);
    this.secondsEl.textContent = this.pad(s);
    this.ampmEl.textContent = ampm;

    // Date Format: Monday, January 1
    const options = { weekday: "long", month: "long", day: "numeric" };
    this.dateEl.textContent = now.toLocaleDateString("en-US", options);
  }

  pad(num) {
    return num.toString().padStart(2, "0");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeClock();
});
