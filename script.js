const state = {
  unit: "imperial",
  inputs: {
    artworkWidth: { raw: "", value: null, parseError: "" },
    artworkHeight: { raw: "", value: null, parseError: "" },
    mouldingFaceWidth: { raw: "", value: null, parseError: "" },
    rabbetDepth: { raw: "", value: null, parseError: "" },
    clearance: { raw: "0.125", value: 0.125, parseError: "" }
  },
  validationErrors: {
    artworkWidth: "",
    artworkHeight: "",
    mouldingFaceWidth: "",
    rabbetDepth: "",
    clearance: ""
  },
  derived: {
    insideOpeningWidth: 0,
    insideOpeningHeight: 0,
    outsideFrameWidth: 0,
    outsideFrameHeight: 0,
    railCutLength: 0,
    stileCutLength: 0
  },
  ui: {
    hasValidResults: false,
    isCopySuccessVisible: false
  }
};

const inputElements = {
  artworkWidth: document.querySelector("#artworkWidth"),
  artworkHeight: document.querySelector("#artworkHeight"),
  mouldingFaceWidth: document.querySelector("#mouldingFaceWidth"),
  rabbetDepth: document.querySelector("#rabbetDepth"),
  clearance: document.querySelector("#clearance")
};

const unitInputs = document.querySelectorAll("input[name='measurementUnit']");
const unitLabelSpans = document.querySelectorAll("[data-unit-label]");
const unitShortSpans = document.querySelectorAll("[data-unit-short]");

const errorElements = {
  artworkWidth: document.querySelector("[data-error-for='artworkWidth']"),
  artworkHeight: document.querySelector("[data-error-for='artworkHeight']"),
  mouldingFaceWidth: document.querySelector("[data-error-for='mouldingFaceWidth']"),
  rabbetDepth: document.querySelector("[data-error-for='rabbetDepth']"),
  clearance: document.querySelector("[data-error-for='clearance']")
};

const resultsSection = document.querySelector("#results");
const resultsFields = {
  insideOpeningWidth: document.querySelector("#insideOpeningWidth"),
  insideOpeningHeight: document.querySelector("#insideOpeningHeight"),
  outsideFrameWidth: document.querySelector("#outsideFrameWidth"),
  outsideFrameHeight: document.querySelector("#outsideFrameHeight"),
  railCutLength: document.querySelector("#railCutLength"),
  stileCutLength: document.querySelector("#stileCutLength"),
  frameVisualWidth: document.querySelector("#frameVisualWidth"),
  frameVisualHeight: document.querySelector("#frameVisualHeight")
};

const copyBtn = document.querySelector("#copyBtn");
const copyStatus = document.querySelector("#copyStatus");

const UNIT_CONFIG = {
  imperial: {
    label: "inches",
    short: "in",
    decimals: 3
  },
  metric: {
    label: "millimeters",
    short: "mm",
    decimals: 0
  }
};

const INCH_TO_MM = 25.4;

function convertValue(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }
  return fromUnit === "imperial" ? value * INCH_TO_MM : value / INCH_TO_MM;
}

function parseNumericInput(rawValue) {
  if (rawValue.trim() === "") {
    return { value: null, error: "" };
  }

  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: "Enter a valid number." };
  }

  return { value: parsed, error: "" };
}

function validateInputs() {
  const errors = {
    artworkWidth: "",
    artworkHeight: "",
    mouldingFaceWidth: "",
    rabbetDepth: "",
    clearance: ""
  };

  // Start with parse errors so invalid typing is caught immediately.
  Object.entries(state.inputs).forEach(([key, input]) => {
    if (input.parseError) {
      errors[key] = input.parseError;
    }
  });

  const aw = state.inputs.artworkWidth.value;
  const ah = state.inputs.artworkHeight.value;
  const fw = state.inputs.mouldingFaceWidth.value;
  const rd = state.inputs.rabbetDepth.value;
  const clearance = state.inputs.clearance.value;

  if (!errors.artworkWidth && aw !== null && aw <= 0) {
    errors.artworkWidth = "Artwork width must be greater than 0.";
  }

  if (!errors.artworkHeight && ah !== null && ah <= 0) {
    errors.artworkHeight = "Artwork height must be greater than 0.";
  }

  if (!errors.mouldingFaceWidth && fw !== null && fw <= 0) {
    errors.mouldingFaceWidth = "Moulding face width must be greater than 0.";
  }

  if (!errors.rabbetDepth && rd !== null && rd < 0) {
    errors.rabbetDepth = "Rabbet depth must be 0 or greater.";
  }

  if (!errors.clearance && clearance !== null && clearance < 0) {
    errors.clearance = "Clearance must be 0 or greater.";
  }

  if (!errors.rabbetDepth && fw !== null && rd !== null && rd > fw) {
    errors.rabbetDepth = "Rabbet depth cannot exceed moulding face width.";
  }

  state.validationErrors = errors;
}

function hasAllRequiredValues() {
  return Object.values(state.inputs).every((item) => item.value !== null);
}

function hasAnyErrors() {
  return Object.values(state.validationErrors).some((message) => message);
}

function calculateDerived() {
  const aw = state.inputs.artworkWidth.value;
  const ah = state.inputs.artworkHeight.value;
  const fw = state.inputs.mouldingFaceWidth.value;
  const rd = state.inputs.rabbetDepth.value;
  const clearance = state.inputs.clearance.value;

  const insideOpeningWidth = aw + clearance;
  const insideOpeningHeight = ah + clearance;

  const outsideFrameWidth = insideOpeningWidth + 2 * fw;
  const outsideFrameHeight = insideOpeningHeight + 2 * fw;

  const railCutLength = insideOpeningWidth + 2 * fw - 2 * rd;
  const stileCutLength = insideOpeningHeight + 2 * fw - 2 * rd;

  state.derived = {
    insideOpeningWidth,
    insideOpeningHeight,
    outsideFrameWidth,
    outsideFrameHeight,
    railCutLength,
    stileCutLength
  };
}

function formatNumber(value) {
  if (state.unit === "metric") {
    return String(Math.ceil(value));
  }
  return value.toFixed(UNIT_CONFIG[state.unit].decimals);
}

function formatInputValue(value) {
  const formatted = formatNumber(value);
  return formatted.replace(/\.?0+$/, "");
}

function updateUnitLabels() {
  const config = UNIT_CONFIG[state.unit];
  unitLabelSpans.forEach((node) => {
    node.textContent = config.label;
  });
  unitShortSpans.forEach((node) => {
    node.textContent = config.short;
  });
}

function updateResultsUI() {
  if (!state.ui.hasValidResults) {
    resultsSection.classList.add("hidden");
    copyBtn.disabled = true;
    return;
  }

  resultsSection.classList.remove("hidden");
  copyBtn.disabled = false;

  resultsFields.insideOpeningWidth.textContent = formatNumber(state.derived.insideOpeningWidth);
  resultsFields.insideOpeningHeight.textContent = formatNumber(state.derived.insideOpeningHeight);
  resultsFields.outsideFrameWidth.textContent = formatNumber(state.derived.outsideFrameWidth);
  resultsFields.outsideFrameHeight.textContent = formatNumber(state.derived.outsideFrameHeight);
  resultsFields.railCutLength.textContent = formatNumber(state.derived.railCutLength);
  resultsFields.stileCutLength.textContent = formatNumber(state.derived.stileCutLength);
  resultsFields.frameVisualWidth.textContent = formatNumber(state.derived.outsideFrameWidth);
  resultsFields.frameVisualHeight.textContent = formatNumber(state.derived.outsideFrameHeight);
}

function updateErrorUI() {
  Object.entries(errorElements).forEach(([key, element]) => {
    element.textContent = state.validationErrors[key];
  });
}

function handleInputChange(event) {
  const { name, value } = event.target;
  if (!state.inputs[name]) {
    return;
  }

  state.inputs[name].raw = value;
  const parsed = parseNumericInput(value);
  state.inputs[name].value = parsed.value;
  state.inputs[name].parseError = parsed.error;

  validateInputs();

  const hasValues = hasAllRequiredValues();
  const hasErrors = hasAnyErrors();

  if (hasValues && !hasErrors) {
    calculateDerived();
    state.ui.hasValidResults = true;
  } else {
    state.ui.hasValidResults = false;
  }

  updateErrorUI();
  updateResultsUI();
}

function buildCopyText() {
  const iow = formatNumber(state.derived.insideOpeningWidth);
  const ioh = formatNumber(state.derived.insideOpeningHeight);
  const ofw = formatNumber(state.derived.outsideFrameWidth);
  const ofh = formatNumber(state.derived.outsideFrameHeight);
  const rail = formatNumber(state.derived.railCutLength);
  const stile = formatNumber(state.derived.stileCutLength);
  const unitShort = UNIT_CONFIG[state.unit].short;

  return [
    "Cut List — Outside Edge (Long Point to Long Point)",
    `Rails (Top & Bottom, Qty 2): ${rail} ${unitShort}`,
    `Stiles (Left & Right, Qty 2): ${stile} ${unitShort}`,
    "",
    "Inside Opening (fits artwork, glass, backing):",
    `${iow} ${unitShort} × ${ioh} ${unitShort}`,
    "",
    "Outside Frame Size (overall frame size):",
    `${ofw} ${unitShort} × ${ofh} ${unitShort}`
  ].join("\n");
}

function showCopyStatus(message) {
  copyStatus.textContent = message;
  if (state.ui.isCopySuccessVisible) {
    return;
  }

  state.ui.isCopySuccessVisible = true;
  setTimeout(() => {
    copyStatus.textContent = "";
    state.ui.isCopySuccessVisible = false;
  }, 2200);
}

async function copyToClipboard() {
  const text = buildCopyText();

  try {
    await navigator.clipboard.writeText(text);
    showCopyStatus("Copied!");
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      showCopyStatus("Copied!");
    } catch (fallbackError) {
      showCopyStatus("Copy failed.");
    }

    document.body.removeChild(textarea);
  }
}

function handleUnitChange(event) {
  const nextUnit = event.target.value;
  if (!UNIT_CONFIG[nextUnit] || nextUnit === state.unit) {
    return;
  }

  const previousUnit = state.unit;
  state.unit = nextUnit;
  updateUnitLabels();

  Object.entries(state.inputs).forEach(([key, input]) => {
    if (input.value === null) {
      return;
    }

    const converted = convertValue(input.value, previousUnit, nextUnit);
    input.value = converted;
    input.raw = formatInputValue(converted);
    input.parseError = "";
    inputElements[key].value = input.raw;
  });

  validateInputs();

  const hasValues = hasAllRequiredValues();
  const hasErrors = hasAnyErrors();

  if (hasValues && !hasErrors) {
    calculateDerived();
    state.ui.hasValidResults = true;
  } else {
    state.ui.hasValidResults = false;
  }

  updateErrorUI();
  updateResultsUI();
}

Object.values(inputElements).forEach((input) => {
  input.addEventListener("input", handleInputChange);
});

unitInputs.forEach((input) => {
  input.addEventListener("change", handleUnitChange);
});

copyBtn.addEventListener("click", () => {
  if (!state.ui.hasValidResults) {
    return;
  }
  copyToClipboard();
});

handleInputChange({ target: inputElements.clearance });
updateUnitLabels();
