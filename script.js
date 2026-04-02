const display = document.querySelector("#display");
const keypad = document.querySelector(".keypad");
const installButton = document.querySelector("#installButton");

let expression = "0";
let shouldReset = false;
let deferredInstallPrompt = null;

const updateDisplay = (value = expression) => {
  display.textContent = value;
};

const isOperator = (char) => ["+", "-", "*", "/", "%"].includes(char);

const normalizeExpression = (value) => value.replace(/×/g, "*").replace(/÷/g, "/");

const appendValue = (value) => {
  if (shouldReset && !isOperator(value)) {
    expression = "0";
    shouldReset = false;
  }

  if (expression === "0" && !isOperator(value) && value !== ".") {
    expression = value;
    updateDisplay();
    return;
  }

  const lastChar = expression.at(-1);

  if (isOperator(value) && isOperator(lastChar)) {
    expression = `${expression.slice(0, -1)}${value}`;
    updateDisplay();
    return;
  }

  if (value === ".") {
    const currentSegment = expression.split(/[+\-*/%]/).at(-1);
    if (currentSegment.includes(".")) {
      return;
    }
  }

  expression += value;
  updateDisplay();
};

const clearAll = () => {
  expression = "0";
  shouldReset = false;
  updateDisplay();
};

const deleteLast = () => {
  if (shouldReset) {
    clearAll();
    return;
  }

  expression = expression.length > 1 ? expression.slice(0, -1) : "0";
  updateDisplay();
};

const calculateResult = () => {
  try {
    const sanitized = normalizeExpression(expression);
    const result = Function(`"use strict"; return (${sanitized})`)();

    if (!Number.isFinite(result)) {
      throw new Error("Invalid calculation");
    }

    expression = Number(result.toFixed(10)).toString();
    shouldReset = true;
    updateDisplay();
  } catch {
    expression = "Error";
    shouldReset = true;
    updateDisplay();
  }
};

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, value } = button.dataset;

  if (action === "clear") {
    clearAll();
    return;
  }

  if (action === "delete") {
    deleteLast();
    return;
  }

  if (action === "equals") {
    calculateResult();
    return;
  }

  if (action === "decimal") {
    appendValue(button.textContent.trim());
    return;
  }

  if (value) {
    appendValue(value);
  }
});

window.addEventListener("keydown", (event) => {
  const { key } = event;

  if (/^[0-9+\-*/.%]$/.test(key)) {
    appendValue(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
    return;
  }

  if (key === "Backspace") {
    deleteLast();
    return;
  }

  if (key === "Escape") {
    clearAll();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // App still works without offline caching if registration fails.
    });
  });
}
