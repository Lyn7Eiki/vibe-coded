class VibeCalendar {
  constructor() {
    this.date = new Date();
    this.currentMonth = this.date.getMonth();
    this.currentYear = this.date.getFullYear();

    this.monthEl = document.getElementById("current-date");
    this.daysEl = document.getElementById("days-container");
    this.prevBtn = document.getElementById("prev-month");
    this.nextBtn = document.getElementById("next-month");
    this.todayBtn = document.getElementById("today-btn");

    this.init();
  }

  init() {
    this.renderCalendar();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.prevBtn.addEventListener("click", () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderCalendar();
    });

    this.nextBtn.addEventListener("click", () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.renderCalendar();
    });

    this.todayBtn.addEventListener("click", () => {
      const now = new Date();
      this.currentMonth = now.getMonth();
      this.currentYear = now.getFullYear();
      this.renderCalendar();
    });
  }

  renderCalendar() {
    // Set Header
    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];
    this.monthEl.textContent = `${this.currentYear}年 ${monthNames[this.currentMonth]}`;

    this.daysEl.innerHTML = "";

    // Days calculation
    const firstDayIndex = new Date(
      this.currentYear,
      this.currentMonth,
      1,
    ).getDay();
    const lastDay = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0,
    ).getDate();
    const prevLastDay = new Date(
      this.currentYear,
      this.currentMonth,
      0,
    ).getDate();

    const lastDayIndex = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0,
    ).getDay();
    const nextDays = 7 - lastDayIndex - 1;

    // Previous month days filler
    for (let x = firstDayIndex; x > 0; x--) {
      const dayDiv = document.createElement("div");
      dayDiv.textContent = prevLastDay - x + 1;
      dayDiv.classList.add("other-month");
      this.daysEl.appendChild(dayDiv);
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= lastDay; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.textContent = i;

      if (
        i === today.getDate() &&
        this.currentMonth === today.getMonth() &&
        this.currentYear === today.getFullYear()
      ) {
        dayDiv.classList.add("today");
      }

      this.daysEl.appendChild(dayDiv);
    }

    // Next month days filler
    // firstDayIndex is 0-6 (Sun-Sat). If first day is Sunday (0), loop doesn't run above.
    // We usually want a consistent grid, but simple flow is okay.

    // Let's ensure at least some padding if needed, or just leave blank if we want simple month view.
    // But rectangular grid is better.
    // The simple logic above works for standard flowing grid.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeCalendar();
});
