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
    stileCutLength: 0,
    totalLinearLength: 0,
    boardWidthUnits: 0,
    boardHeightUnits: 0
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
  totalLinearLength: document.querySelector("#totalLinearLength"),
  boardFootprintWidth: document.querySelector("#boardFootprintWidth"),
  boardFootprintHeight: document.querySelector("#boardFootprintHeight"),
  frameVisualWidth: document.querySelector("#frameVisualWidth"),
  frameVisualHeight: document.querySelector("#frameVisualHeight")
};

const boardLayout = {
  diagram: document.querySelector(".board-layout__diagram"),
  stage: document.querySelector(".board-layout__stage"),
  board: document.querySelector(".board-layout__board"),
  dimensions: {
    width: document.querySelector("#boardWidth"),
    height: document.querySelector("#boardHeight")
  },
  blanks: {
    stileLeft: document.querySelector("[data-blank='stile-left']"),
    railTop: document.querySelector("[data-blank='rail-top']"),
    railBottom: document.querySelector("[data-blank='rail-bottom']"),
    stileRight: document.querySelector("[data-blank='stile-right']")
  }
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
  const totalLinearLength = railCutLength * 2 + stileCutLength * 2;

  state.derived = {
    insideOpeningWidth,
    insideOpeningHeight,
    outsideFrameWidth,
    outsideFrameHeight,
    railCutLength,
    stileCutLength,
    totalLinearLength,
    boardWidthUnits: state.derived.boardWidthUnits,
    boardHeightUnits: state.derived.boardHeightUnits
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
  resultsFields.totalLinearLength.textContent = formatNumber(state.derived.totalLinearLength);
  resultsFields.frameVisualWidth.textContent = formatNumber(state.derived.outsideFrameWidth);
  resultsFields.frameVisualHeight.textContent = formatNumber(state.derived.outsideFrameHeight);
  updateBoardLayout();
  resultsFields.boardFootprintWidth.textContent = formatNumber(state.derived.boardWidthUnits);
  resultsFields.boardFootprintHeight.textContent = formatNumber(state.derived.boardHeightUnits);
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

function getDiagramInnerSize() {
  if (!boardLayout.diagram || !boardLayout.stage) {
    return { width: 0, height: 0 };
  }
  const styles = window.getComputedStyle(boardLayout.diagram);
  const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const stageWidth = boardLayout.stage.clientWidth;
  const stageHeight = boardLayout.stage.clientHeight;
  return {
    width: Math.max(Math.min(boardLayout.diagram.clientWidth - paddingX, stageWidth), 0),
    height: Math.max(Math.min(boardLayout.diagram.clientHeight - paddingY, stageHeight), 0)
  };
}

function updateBoardLayout() {
  if (!boardLayout.board) {
    return;
  }

  const fw = state.inputs.mouldingFaceWidth.value;
  const railLength = state.derived.railCutLength;
  const stileLength = state.derived.stileCutLength;

  if (fw === null || railLength === null || stileLength === null) {
    return;
  }

  const gap = convertValue(0.5, "imperial", state.unit);
  const columnHeightUnits = railLength + stileLength + gap;
  const boardWidthUnits = fw * 2 + gap * 3;
  const boardHeightUnits = columnHeightUnits + gap * 2;

  const { width: maxWidth, height: maxHeight } = getDiagramInnerSize();
  if (!maxWidth || !maxHeight) {
    return;
  }

  const scale = Math.min(maxWidth / boardWidthUnits, maxHeight / boardHeightUnits);
  const minGapPx = 12;
  const minBlankWidthPx = 80;
  const minBlankHeightPx = 80;

  const gapPx = Math.max(gap * scale, minGapPx);
  const blankWidthPx = Math.max(fw * scale, minBlankWidthPx);
  const railLengthPx = Math.max(railLength * scale, minBlankHeightPx);
  const stileLengthPx = Math.max(stileLength * scale, minBlankHeightPx);

  const boardWidthPx = blankWidthPx * 2 + gapPx * 3;
  const boardHeightPx = railLengthPx + stileLengthPx + gapPx * 3;

  boardLayout.board.style.width = `${boardWidthPx}px`;
  boardLayout.board.style.height = `${boardHeightPx}px`;

  const originX = gapPx;
  const originY = gapPx;
  const columnGapPx = gapPx;
  const rowGapPx = gapPx;
  const columnTwoX = originX + blankWidthPx + columnGapPx;
  const topPieceY = originY;
  const columnOneSecondY = originY + stileLengthPx + rowGapPx;
  const columnTwoSecondY = originY + railLengthPx + rowGapPx;

  boardLayout.blanks.stileLeft.style.width = `${blankWidthPx}px`;
  boardLayout.blanks.stileLeft.style.height = `${stileLengthPx}px`;
  boardLayout.blanks.stileLeft.style.left = `${originX}px`;
  boardLayout.blanks.stileLeft.style.top = `${topPieceY}px`;
  boardLayout.blanks.stileLeft.style.transform = "none";

  boardLayout.blanks.railTop.style.width = `${blankWidthPx}px`;
  boardLayout.blanks.railTop.style.height = `${railLengthPx}px`;
  boardLayout.blanks.railTop.style.left = `${originX}px`;
  boardLayout.blanks.railTop.style.top = `${columnOneSecondY}px`;
  boardLayout.blanks.railTop.style.transform = "none";

  boardLayout.blanks.railBottom.style.width = `${blankWidthPx}px`;
  boardLayout.blanks.railBottom.style.height = `${railLengthPx}px`;
  boardLayout.blanks.railBottom.style.left = `${columnTwoX}px`;
  boardLayout.blanks.railBottom.style.top = `${topPieceY}px`;
  boardLayout.blanks.railBottom.style.transform = "none";

  boardLayout.blanks.stileRight.style.width = `${blankWidthPx}px`;
  boardLayout.blanks.stileRight.style.height = `${stileLengthPx}px`;
  boardLayout.blanks.stileRight.style.left = `${columnTwoX}px`;
  boardLayout.blanks.stileRight.style.top = `${columnTwoSecondY}px`;
  boardLayout.blanks.stileRight.style.transform = "none";

  if (boardLayout.dimensions.width && boardLayout.dimensions.height) {
    boardLayout.dimensions.width.textContent = formatNumber(boardWidthUnits);
    boardLayout.dimensions.height.textContent = formatNumber(boardHeightUnits);
  }

  state.derived.boardWidthUnits = boardWidthUnits;
  state.derived.boardHeightUnits = boardHeightUnits;
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

window.addEventListener("resize", () => {
  if (!state.ui.hasValidResults) {
    return;
  }
  updateBoardLayout();
});

handleInputChange({ target: inputElements.clearance });
updateUnitLabels();
