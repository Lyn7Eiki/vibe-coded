class AttendanceCalculator {
  constructor() {
    this.inputArea = document.getElementById("input-times");
    this.calcBtn = document.getElementById("calc-btn");
    this.clearBtn = document.getElementById("clear-btn");
    this.resultArea = document.getElementById("result-area");
    this.resultTableBody = document.querySelector("#result-table tbody");
    this.totalDaysEl = document.getElementById("total-days");
    this.totalHoursEl = document.getElementById("total-hours");

    this.init();
  }

  init() {
    this.calcBtn.addEventListener("click", () => this.calculate());
    this.clearBtn.addEventListener("click", () => {
      this.inputArea.value = "";
      this.resultArea.classList.add("hidden");
    });
  }

  parseTime(timeStr) {
    const [h, m] = timeStr.trim().split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  }

  calculate() {
    const text = this.inputArea.value;
    const lines = text.split("\n");
    let totalMonthHours = 0;
    let validDays = 0;

    this.resultTableBody.innerHTML = "";

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      // Extract times using regex to handle various separators
      const timeStrings = line.match(/\d{1,2}:\d{2}/g);

      if (!timeStrings || timeStrings.length % 2 !== 0) {
        this.renderErrorRow(index + 1, line, "无效的时间记录（必须成对）");
        return;
      }

      const times = timeStrings.map((t) => this.parseTime(t));
      // Sort times just in case, though user usually provides in order
      times.sort((a, b) => a - b);

      let dayTotalHours = 0;
      let sessions = [];
      let lianbanTags = [];

      // Process sessions (pairs)
      for (let i = 0; i < times.length; i += 2) {
        const start = times[i];
        const end = times[i + 1];

        // Calculate duration
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);

        // Apply 30-min rounding rule
        // floor(mins / 30) * 0.5
        const hours = Math.floor(diffMins / 30) * 0.5;

        dayTotalHours += hours;

        const startStr = `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`;
        const endStr = `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;

        sessions.push({
          startStr,
          endStr,
          rawMins: diffMins,
          calcHours: hours,
        });

        // Check for Lianban with previous session if exists
        if (i > 0) {
          const prevEnd = times[i - 1];
          const currStart = start;
          const gapMs = currStart - prevEnd;
          const gapMins = Math.floor(gapMs / 60000);

          if (gapMins <= 30) {
            // Determine type based on time
            const hour = prevEnd.getHours();
            if (hour >= 11 && hour <= 13) {
              lianbanTags.push("中午连班");
            } else if (hour >= 16 && hour <= 19) {
              lianbanTags.push("晚上连班");
            } else {
              lianbanTags.push("连班");
            }
          }
        }
      }

      validDays++;
      totalMonthHours += dayTotalHours;
      this.renderRow(index + 1, sessions, lianbanTags, dayTotalHours);
    });

    this.totalDaysEl.textContent = validDays;
    this.totalHoursEl.textContent = totalMonthHours.toFixed(1);
    this.resultArea.classList.remove("hidden");
  }

  renderRow(index, sessions, tags, total) {
    const tr = document.createElement("tr");

    // Sessions HTML
    const sessionsHtml = sessions
      .map(
        (s) =>
          `<div class="tag session">
        ${s.startStr}-${s.endStr} (${s.rawMins}分) -> <b>${s.calcHours}h</b>
       </div>`,
      )
      .join("");

    // Tags HTML
    const tagsHtml =
      tags.length > 0
        ? tags.map((t) => `<span class="tag lianban">${t}</span>`).join("")
        : "<span style='color:#ccc'>无</span>";

    tr.innerHTML = `
      <td>${index}</td>
      <td>${sessionsHtml}</td>
      <td>${tagsHtml}</td>
      <td class="total-cell">${total} h</td>
    `;

    this.resultTableBody.appendChild(tr);
  }

  renderErrorRow(index, content, msg) {
    const tr = document.createElement("tr");
    tr.style.background = "#fff1f2";
    tr.innerHTML = `
      <td>${index}</td>
      <td colspan="3" style="color:#e11d48">
        <b>错误:</b> ${msg}<br>
        <span style="font-size:0.8em; color:#888">${content}</span>
      </td>
    `;
    this.resultTableBody.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AttendanceCalculator();
});
