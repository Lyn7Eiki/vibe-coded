class VibeCalculator {
  constructor() {
    this.display = document.getElementById("display");
    this.buttons = document.querySelectorAll(".btn");

    this.expression = "";

    this.init();
  }

  init() {
    this.buttons.forEach((btn) => {
      btn.addEventListener("click", () => this.handleInput(btn));
    });
  }

  handleInput(btn) {
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if (val !== undefined) {
      this.addToExpression(val);
    } else if (action) {
      this.handleAction(action);
    }
  }

  addToExpression(val) {
    if (this.expression === "0" && val !== ".") {
      this.expression = val;
    } else {
      this.expression += val;
    }
    this.updateDisplay();
  }

  handleAction(action) {
    switch (action) {
      case "clear":
        this.expression = "";
        this.updateDisplay("0");
        break;
      case "calculate":
        this.calculate();
        break;
      case "add":
        this.addToExpression("+");
        break;
      case "subtract":
        this.addToExpression("-");
        break;
      case "multiply":
        this.addToExpression("*");
        break;
      case "divide":
        this.addToExpression("/");
        break;
      case "parenthesis-open":
        this.addToExpression("(");
        break;
      case "parenthesis-close":
        this.addToExpression(")");
        break;
      case "percent":
        this.addToExpression("/100");
        break;
    }
  }

  updateDisplay(val) {
    // Display visual operators instead of JS operators
    let displayVal = val || this.expression;
    displayVal = displayVal.replace(/\*/g, "×").replace(/\//g, "÷");
    this.display.value = displayVal || "0";
  }

  calculate() {
    try {
      const res = new Function("return " + this.expression)();
      const result = parseFloat(res.toPrecision(10)).toString();
      this.updateDisplay(result);
      this.expression = result;
    } catch (e) {
      this.updateDisplay("Error");
      this.expression = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VibeCalculator();
});
