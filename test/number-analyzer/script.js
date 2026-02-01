class NumberAnalyzer {
  constructor() {
    this.standardInput = document.getElementById("standard");
    this.numbersInput = document.getElementById("numbers");
    this.analyzeBtn = document.getElementById("analyze-btn");
    this.resultsSection = document.getElementById("results");
    this.countEl = document.getElementById("count");
    this.sumEl = document.getElementById("sum");
    this.diffEl = document.getElementById("diff");
    this.frequencyList = document.getElementById("frequency-list");

    this.init();
  }

  init() {
    this.analyzeBtn.addEventListener("click", () => this.analyze());

    // Allow Enter key to trigger analysis
    this.numbersInput.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        this.analyze();
      }
    });
  }

  parseNumbers(input) {
    // Split by newlines, commas, spaces, or tabs
    const parts = input.split(/[\n,\s\t]+/);
    const numbers = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === "") continue;

      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }

    return numbers;
  }

  analyze() {
    const standard = parseFloat(this.standardInput.value) || 0;
    const numbers = this.parseNumbers(this.numbersInput.value);

    if (numbers.length === 0) {
      alert("请输入至少一个数字");
      return;
    }

    // Calculate statistics
    const count = numbers.length;
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    const diff = sum - standard;

    // Calculate frequency
    const frequency = {};
    for (const num of numbers) {
      frequency[num] = (frequency[num] || 0) + 1;
    }

    // Display results
    this.displayResults(count, sum, diff, frequency);
  }

  displayResults(count, sum, diff, frequency) {
    this.resultsSection.classList.remove("hidden");

    // Update stats
    this.countEl.textContent = count;
    this.sumEl.textContent = sum;

    // Format diff with sign
    const diffSign = diff > 0 ? "+" : "";
    this.diffEl.textContent = `${diffSign}${diff}`;

    // Color diff based on value
    this.diffEl.className = "stat-value";
    if (diff > 0) {
      this.diffEl.classList.add("positive");
    } else if (diff < 0) {
      this.diffEl.classList.add("negative");
    } else {
      this.diffEl.classList.add("zero");
    }

    // Render frequency list
    this.renderFrequency(frequency);
  }

  renderFrequency(frequency) {
    // Sort by number value
    const sortedEntries = Object.entries(frequency).sort(
      (a, b) => parseFloat(a[0]) - parseFloat(b[0]),
    );

    // Find max frequency for bar scaling
    const maxFreq = Math.max(...Object.values(frequency));

    this.frequencyList.innerHTML = sortedEntries
      .map(([num, freq]) => {
        const barWidth = (freq / maxFreq) * 100;
        return `
          <li class="frequency-item">
            <span class="frequency-number">${num}</span>
            <div class="frequency-bar">
              <div class="frequency-bar-fill" style="width: ${barWidth}%"></div>
            </div>
            <span class="frequency-count">出现${freq}次</span>
          </li>
        `;
      })
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NumberAnalyzer();
});
