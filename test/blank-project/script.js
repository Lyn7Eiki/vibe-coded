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

  // Returns { h, m, rawStr } or null
  parseTime(timeStr) {
    const cleanStr = timeStr.trim();
    if (cleanStr === "24:00" || cleanStr === "24:0")
      return { h: 24, m: 0, rawStr: "24:00" };

    const [hStr, mStr] = cleanStr.split(":");
    const h = parseInt(hStr);
    const m = parseInt(mStr);

    if (isNaN(h) || isNaN(m)) return null;
    return {
      h,
      m,
      rawStr: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    };
  }

  calculate() {
    const text = this.inputArea.value;
    const lines = text.split("\n");
    let totalMonthHours = 0;
    let validDays = 0;

    this.resultTableBody.innerHTML = "";

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      // Extract times using regex
      const matches = line.match(/\d{1,2}:\d{2}/g);

      if (!matches || matches.length % 2 !== 0) {
        this.renderErrorRow(index + 1, line, "无效的时间记录（必须成对）");
        return;
      }

      // 1. Parse raw times
      const rawTimes = matches
        .map((t) => this.parseTime(t))
        .filter((t) => t !== null);

      if (rawTimes.length !== matches.length) {
        this.renderErrorRow(index + 1, line, "时间格式解析错误");
        return;
      }

      // 2. Convert to linear timeline (minutes) handling day crossing
      const timePoints = [];
      let dayOffset = 0;
      let lastMins = -1;

      rawTimes.forEach((t, i) => {
        let currentMins = t.h * 60 + t.m;

        // If time goes backward (e.g. 23:50 -> 08:00), assume next day
        // Special case: 08:00 -> 08:00 (assume 0 duration? or next day 24h?)
        // Let's assume strictly smaller implies next day for simplicity in shift contexts.
        if (currentMins < lastMins) {
          dayOffset += 1440; // Add 24 hours
        }

        // Also handle explicit 24:00 case logic if needed, but 24:00 (1440) > 23:00 (1380), so logic holds.
        // What if 24:00 -> 00:10? 1440 -> 10. 10 < 1440. Offset adds. Correct.

        timePoints.push({
          totalMins: currentMins + dayOffset,
          display: t.rawStr,
          isNextDay: dayOffset > 0,
          originalH: t.h, // used for checking range type
        });

        lastMins = currentMins;
      });

      // 3. Calculate sessions
      let dayTotalHours = 0;
      let sessions = [];
      let lianbanTags = [];

      for (let i = 0; i < timePoints.length; i += 2) {
        const start = timePoints[i];
        const end = timePoints[i + 1];

        // Duration
        const diffMins = end.totalMins - start.totalMins;

        // New Rule: Negative duration shouldn't happen with our logic, but safe check
        const validDiff = Math.max(0, diffMins);

        // Rounding: floor(mins / 30) * 0.5
        const hours = Math.floor(validDiff / 30) * 0.5;
        dayTotalHours += hours;

        // Display string (add +1 if next day)
        const formatTime = (t) =>
          t.isNextDay
            ? `${t.display}<small class="next-day">+1</small>`
            : t.display;

        sessions.push({
          startHtml: formatTime(start),
          endHtml: formatTime(end),
          rawMins: validDiff,
          calcHours: hours,
        });

        // 4. Lianban Check (Gap between previous end and current start)
        if (i > 0) {
          const prevEnd = timePoints[i - 1];
          const currStart = start;
          const gapMins = currStart.totalMins - prevEnd.totalMins;

          if (gapMins <= 30 && gapMins >= 0) {
            // Check time range based on prevEnd time (mod 1440 to handle Day 2 noon)
            // Noon: 11:00 (660) - 13:00 (780)
            // Evening: 16:00 (960) - 19:00 (1140)

            const checkMins = prevEnd.totalMins % 1440;

            if (checkMins >= 660 && checkMins <= 840) {
              lianbanTags.push({ text: "中午连班", type: "noon" });
            } else if (checkMins >= 960 && checkMins <= 1140) {
              lianbanTags.push({ text: "晚上连班", type: "evening" });
            } else {
              lianbanTags.push({ text: "连班", type: "other" });
            }
          }
        }
      }

      validDays++;
      totalMonthHours += dayTotalHours;
      this.renderRow(
        index + 1,
        sessions,
        lianbanTags,
        dayTotalHours,
        timePoints.length,
      );
    });

    this.totalDaysEl.textContent = validDays;
    this.totalHoursEl.textContent = totalMonthHours.toFixed(1);
    this.resultArea.classList.remove("hidden");
  }

  renderRow(index, sessions, tags, total, count) {
    const tr = document.createElement("tr");

    // Sessions HTML
    const sessionsHtml = sessions
      .map(
        (s) =>
          `<div class="tag session">
        ${s.startHtml}-${s.endHtml} (${s.rawMins}分) -> <b>${s.calcHours}h</b>
       </div>`,
      )
      .join("");

    // Tags HTML
    const tagsHtml =
      tags.length > 0
        ? tags
            .map((t) => {
              let className = "tag ";
              if (t.type === "noon") className += "lianban-noon";
              else if (t.type === "evening") className += "lianban-evening";
              else className += "lianban";

              return `<span class="${className}">${t.text}</span>`;
            })
            .join("")
        : "<span style='color:#ccc'>无</span>";

    tr.innerHTML = `
      <td>${index}</td>
      <td style="text-align:center; font-weight:bold; color:#64748b">打卡${count}次</td>
      <td>${sessionsHtml}</td>
      <td>${tagsHtml}</td>
      <td class="total-cell">工时${total}小时</td>
    `;

    this.resultTableBody.appendChild(tr);
  }

  renderErrorRow(index, content, msg) {
    const tr = document.createElement("tr");
    tr.style.background = "#fff1f2";
    tr.innerHTML = `
      <td>${index}</td>
      <td colspan="4" style="color:#e11d48">
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
