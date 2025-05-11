// Terminal functionality with enhanced features
const terminal = document.getElementById("terminal-output");
const statusReadout = document.querySelector(".system-readout .readout-value");
const countdownElement = document.querySelector("#countdown .readout-value");

// System state tracking
const systemState = {
  power: false,
  comms: false,
  nav: false,
  life: false,
  fuel: 85,
  oxygen: 92,
  altitude: 0,
  speed: 0,
  temperature: 45,
  pressure: 60,
  launched: false,
  thrustLevel: 75,
  orbit: 55,
  diagnosticsRunning: false,
  alarmState: false,
};

// Add text to terminal with enhanced typewriter effect
function addTerminalText(text, delay = 50, customClass = "") {
  let i = 0;
  const promptSpan = document.createElement("span");
  promptSpan.className = "terminal-prompt";
  promptSpan.innerHTML = "<br>> ";
  terminal.appendChild(promptSpan);

  const textSpan = document.createElement("span");
  if (customClass) textSpan.className = customClass;
  terminal.appendChild(textSpan);

  function typeWriter() {
    if (i < text.length) {
      textSpan.innerHTML += text.charAt(i);
      terminal.scrollTop = terminal.scrollHeight;
      i++;
      setTimeout(typeWriter, delay);
    } else {
      terminal.scrollTop = terminal.scrollHeight;
      // Add timestamp
      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour12: false,
      });
      const timeSpan = document.createElement("span");
      timeSpan.className = "terminal-timestamp";
      timeSpan.innerHTML = ` [${timestamp}]`;
      terminal.appendChild(timeSpan);
    }
  }

  typeWriter();
}

// System boot sequence with enhanced stages
function systemBoot() {
  // Clear terminal first
  terminal.innerHTML = "> SYSTEM BOOT SEQUENCE INITIATED...";

  const bootSequence = [
    { message: "BIOS VERSION 3.21 LOADED", delay: 500, class: "" },
    { message: "PERFORMING MEMORY CHECK... 64MB OK", delay: 800, class: "" },
    { message: "INITIALIZING SUBSYSTEMS...", delay: 1000, class: "" },
    { message: "LOADING ROCKET CONTROL MODULE V1.95", delay: 1000, class: "" },
    { message: "POWER: INITIALIZING...", delay: 800, class: "" },
    { message: "POWER: NOMINAL", delay: 500, class: "text-green" },
    { message: "NAVIGATION: CALIBRATING...", delay: 800, class: "" },
    { message: "NAVIGATION: ALIGNED", delay: 500, class: "text-green" },
    {
      message: "COMMUNICATION: CHECKING FREQUENCIES...",
      delay: 800,
      class: "",
    },
    { message: "COMMUNICATION: ONLINE", delay: 500, class: "text-green" },
    { message: "LIFE SUPPORT: RUNNING DIAGNOSTICS...", delay: 800, class: "" },
    { message: "LIFE SUPPORT: READY", delay: 500, class: "text-green" },
    { message: "FUEL SYSTEMS: CHECKING PRESSURE...", delay: 800, class: "" },
    { message: "FUEL SYSTEMS: NOMINAL", delay: 500, class: "text-green" },
    {
      message: "GUIDANCE COMPUTER: LOADING TRAJECTORY DATA...",
      delay: 800,
      class: "",
    },
    { message: "GUIDANCE COMPUTER: ONLINE", delay: 500, class: "text-green" },
    { message: "ALL SYSTEMS INITIALIZED", delay: 500, class: "text-yellow" },
    {
      message: "ROCKET CONTROL SYSTEM READY FOR OPERATION",
      delay: 500,
      class: "text-green",
    },
  ];

  let totalDelay = 0;
  bootSequence.forEach((item, index) => {
    totalDelay += item.delay;
    setTimeout(() => {
      addTerminalText(item.message, 30, item.class);

      // When boot is complete, set status to READY
      if (index === bootSequence.length - 1) {
        statusReadout.textContent = "READY";
        // Activate subtle animations for idle state
        startIdleAnimations();
      }
    }, totalDelay);
  });
}

// Add CSS classes for text colors if they don't exist
function addTerminalStyles() {
  if (!document.getElementById("terminal-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "terminal-styles";
    styleEl.innerHTML = `
      .text-green { color: #00ff00; }
      .text-red { color: #ff3333; }
      .text-yellow { color: #ffff00; }
      .text-blue { color: #3399ff; }
      .terminal-timestamp { color: #999999; font-size: 0.8em; }
      .terminal-prompt { color: #ffffff; }
      .terminal-warning { color: #ff9900; font-weight: bold; }
      .terminal-critical { color: #ff0000; font-weight: bold; animation: blink 1s infinite; }
      @keyframes blink { 
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .armed {
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0% { background-color: var(--button-red); }
        50% { background-color: #ff6666; }
        100% { background-color: var(--button-red); }
      }
      .button-flash {
        animation: flash 0.3s;
      }
      @keyframes flash {
        0% { background-color: var(--button-face); }
        50% { background-color: #ffffff; }
        100% { background-color: var(--button-face); }
      }
      .active-preset {
        background-color: #aaaaff;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// Handle dropdown preset groups with improved animations
function setupPresetMenus() {
  const presetHeaders = document.querySelectorAll(".preset-header");

  presetHeaders.forEach((header) => {
    const content = header.nextElementSibling;
    const arrow = header.querySelector(".dropdown-arrow");

    // Initialize all as collapsed
    content.style.maxHeight = "0px";

    header.addEventListener("click", () => {
      // Close any other open menus first
      document
        .querySelectorAll(".preset-content.expanded")
        .forEach((openContent) => {
          if (openContent !== content) {
            const openArrow =
              openContent.previousElementSibling.querySelector(
                ".dropdown-arrow",
              );
            openContent.classList.remove("expanded");
            openArrow.classList.remove("expanded");
            openContent.style.maxHeight = "0px";
          }
        });

      // Toggle the clicked menu
      content.classList.toggle("expanded");
      arrow.classList.toggle("expanded");

      if (content.classList.contains("expanded")) {
        content.style.maxHeight = content.scrollHeight + "px";
        addTerminalText(
          `OPENING ${header.querySelector("span").textContent} MENU`,
          30,
          "text-blue",
        );

        // Play a menu open sound
        playSystemSound("menu-open");
      } else {
        content.style.maxHeight = "0px";
        addTerminalText(
          `CLOSING ${header.querySelector("span").textContent} MENU`,
          30,
          "text-blue",
        );

        // Play a menu close sound
        playSystemSound("menu-close");
      }
    });
  });
}

// Handle preset buttons with realistic system effects
function setupPresetButtons() {
  const presetButtons = document.querySelectorAll(".preset-button");

  presetButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const presetName = this.textContent;
      const presetGroup =
        this.closest(".preset-content").previousElementSibling.querySelector(
          "span",
        ).textContent;

      // Visual feedback
      this.classList.add("active-preset");
      setTimeout(() => {
        this.classList.remove("active-preset");
      }, 200);

      addTerminalText(
        `ACTIVATING ${presetGroup}: ${presetName}`,
        30,
        "text-yellow",
      );
      playSystemSound("preset-activate");

      // Simulate system loading
      addTerminalText(`LOADING CONFIGURATION PARAMETERS...`, 30);

      setTimeout(() => {
        addTerminalText(`APPLYING SYSTEM CHANGES...`, 30);

        // Generate preset-specific settings
        const presetSettings = generatePresetSettings(presetName, presetGroup);

        // Apply the presets to sliders and system state
        applyPresetSettings(presetSettings);

        setTimeout(() => {
          addTerminalText(
            `${presetGroup}: ${presetName} CONFIGURATION ACTIVE`,
            30,
            "text-green",
          );

          // If it's a launch preset, show additional details
          if (presetGroup === "LAUNCH PRESETS") {
            addTerminalText(
              `FLIGHT PROFILE SET TO: ${presetName}`,
              30,
              "text-blue",
            );
            addTerminalText(
              `ESTIMATED BURN TIME: ${
                Math.floor(Math.random() * 300) + 120
              } SECONDS`,
              30,
            );
            addTerminalText(`GUIDANCE PARAMETERS UPDATED`, 30);
          }
        }, 800);
      }, 1200);
    });
  });
}

// Generate realistic preset settings based on the preset name
function generatePresetSettings(presetName, presetGroup) {
  let settings = {};

  if (presetGroup === "LAUNCH PRESETS") {
    switch (presetName) {
      case "LOW ORBIT":
        settings = {
          thrust: 75,
          fuel: 65,
          altitude: 60,
          speed: 80,
          orbit: 40,
        };
        break;
      case "HIGH ORBIT":
        settings = {
          thrust: 85,
          fuel: 75,
          altitude: 90,
          speed: 85,
          orbit: 70,
        };
        break;
      case "LUNAR":
        settings = {
          thrust: 95,
          fuel: 95,
          altitude: 95,
          speed: 90,
          orbit: 85,
        };
        break;
      case "MARS":
        settings = {
          thrust: 100,
          fuel: 100,
          altitude: 100,
          speed: 100,
          orbit: 95,
        };
        break;
      case "DEEP SPACE":
        settings = {
          thrust: 100,
          fuel: 100,
          altitude: 100,
          speed: 100,
          orbit: 100,
        };
        break;
      case "RETURN":
        settings = {
          thrust: 50,
          fuel: 30,
          altitude: 20,
          speed: 60,
          orbit: 15,
        };
        break;
    }
  } else if (presetGroup === "SYSTEM PRESETS") {
    switch (presetName) {
      case "NORMAL":
        settings = {
          power: 65,
          oxygen: 75,
          temperature: 50,
          pressure: 60,
        };
        break;
      case "ECONOMY":
        settings = {
          power: 40,
          oxygen: 60,
          temperature: 40,
          pressure: 50,
        };
        break;
      case "MAX POWER":
        settings = {
          power: 100,
          oxygen: 90,
          temperature: 70,
          pressure: 85,
        };
        break;
      case "EMERGENCY":
        settings = {
          power: 85,
          oxygen: 100,
          temperature: 60,
          pressure: 70,
        };
        break;
      case "STANDBY":
        settings = {
          power: 30,
          oxygen: 50,
          temperature: 45,
          pressure: 55,
        };
        break;
      case "SLEEP":
        settings = {
          power: 15,
          oxygen: 40,
          temperature: 30,
          pressure: 45,
        };
        break;
    }
  } else if (presetGroup === "CUSTOM PROGRAMS") {
    // Generate random values for custom programs
    settings = {
      thrust: Math.floor(Math.random() * 60) + 40,
      fuel: Math.floor(Math.random() * 40) + 60,
      altitude: Math.floor(Math.random() * 80) + 20,
      speed: Math.floor(Math.random() * 50) + 50,
      orbit: Math.floor(Math.random() * 70) + 30,
      power: Math.floor(Math.random() * 60) + 40,
      oxygen: Math.floor(Math.random() * 30) + 70,
      temperature: Math.floor(Math.random() * 40) + 40,
      pressure: Math.floor(Math.random() * 30) + 60,
    };
  }

  return settings;
}

// Apply preset settings to the UI and system state
function applyPresetSettings(settings) {
  const allSliders = document.querySelectorAll(".slider-handle");
  const allFills = document.querySelectorAll(".slider-fill");
  const allValues = document.querySelectorAll(".slider-value");

  // Update relevant sliders based on settings
  allSliders.forEach((handle, index) => {
    const sliderLabel = handle
      .closest(".slider-wrapper")
      .querySelector(".slider-label").textContent;
    let newValue = 50; // Default value

    // Map slider labels to setting properties
    switch (sliderLabel) {
      case "THRUST":
        newValue = settings.thrust || Math.floor(Math.random() * 100);
        break;
      case "ALT":
        newValue = settings.altitude || Math.floor(Math.random() * 100);
        break;
      case "FUEL":
        newValue = settings.fuel || Math.floor(Math.random() * 100);
        break;
      case "SPEED":
        newValue = settings.speed || Math.floor(Math.random() * 100);
        break;
      case "TEMP":
        newValue = settings.temperature || Math.floor(Math.random() * 100);
        break;
      case "O₂":
        newValue = settings.oxygen || Math.floor(Math.random() * 100);
        break;
      case "HULL":
        newValue = Math.floor(Math.random() * 100);
        break;
      case "ORBIT":
        newValue = settings.orbit || Math.floor(Math.random() * 100);
        break;
      case "POWER":
        newValue = settings.power || Math.floor(Math.random() * 100);
        break;
      case "PRESS":
        newValue = settings.pressure || Math.floor(Math.random() * 100);
        break;
      default:
        newValue = Math.floor(Math.random() * 100);
    }

    // Animate the slider to its new position
    animateSlider(handle, allFills[index], allValues[index], newValue);

    // Update system state
    updateSystemState(sliderLabel, newValue);
  });

  // Update gauges to match sliders
  updateGauges();
}

// Animate a slider to a new value with realistic motion
function animateSlider(handle, fill, valueDisplay, targetValue) {
  const currentValue = Number.parseInt(valueDisplay.textContent);
  const difference = targetValue - currentValue;
  const steps = 20; // Number of animation steps
  const increment = difference / steps;
  let step = 0;

  const animation = setInterval(() => {
    step++;
    const newValue = Math.round(currentValue + increment * step);

    // Update handle position
    handle.style.bottom = `${newValue}%`;

    // Update fill height
    fill.style.height = `${newValue}%`;

    // Update value display
    valueDisplay.textContent = newValue;

    if (step >= steps) {
      clearInterval(animation);
      // Final adjustment to ensure exact target value
      handle.style.bottom = `${targetValue}%`;
      fill.style.height = `${targetValue}%`;
      valueDisplay.textContent = targetValue;
    }
  }, 25);
}

// Update system state based on slider changes
function updateSystemState(label, value) {
  switch (label) {
    case "THRUST":
      systemState.thrustLevel = value;
      break;
    case "ALT":
      systemState.altitude = value;
      break;
    case "FUEL":
      systemState.fuel = value;
      break;
    case "SPEED":
      systemState.speed = value;
      break;
    case "TEMP":
      systemState.temperature = value;
      break;
    case "O₂":
      systemState.oxygen = value;
      break;
    case "ORBIT":
      systemState.orbit = value;
      break;
    case "POWER":
      systemState.power = value;
      break;
    case "PRESS":
      systemState.pressure = value;
      break;
  }

  // If any critical system goes below threshold, trigger alarm
  if (
    (systemState.fuel < 20 ||
      systemState.oxygen < 20 ||
      systemState.power < 15) &&
    !systemState.alarmState
  ) {
    triggerAlarm();
  }
}

// Trigger system alarm for low resources
function triggerAlarm() {
  systemState.alarmState = true;

  // Activate random LEDs
  const leds = document.querySelectorAll(".led");
  leds.forEach((led) => {
    led.classList.add("active");
  });

  // Play alarm sound
  playSystemSound("alarm");

  // Show alarm message
  addTerminalText(
    "WARNING: CRITICAL SYSTEM RESOURCE LOW",
    20,
    "terminal-warning",
  );
  addTerminalText(
    "ALARM ACTIVATED - CHECK SYSTEM STATUS",
    20,
    "terminal-critical",
  );
}

// Enhanced sliders functionality with sounds and improved tracking
function setupSliders() {
  const sliderHandles = document.querySelectorAll(".slider-handle");

  sliderHandles.forEach((handle) => {
    let isDragging = false;
    let startY, startBottom;
    let lastOutput = 0;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startBottom = Number.parseFloat(handle.style.bottom || "0");
      if (isNaN(startBottom)) startBottom = 0;
      e.preventDefault();

      // Play slider grab sound
      playSystemSound("slider-grab");
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const track = handle.closest(".slider-track");
      const fill = track.querySelector(".slider-fill");
      const valueDisplay = handle
        .closest(".slider-wrapper")
        .querySelector(".slider-value");

      const trackRect = track.getBoundingClientRect();
      const deltaY = startY - e.clientY;

      // Calculate new position as percentage
      let newBottom = startBottom + (deltaY / trackRect.height) * 100;
      newBottom = Math.max(0, Math.min(100, newBottom));

      // Update handle position
      handle.style.bottom = `${newBottom}%`;

      // Update fill height
      fill.style.height = `${newBottom}%`;

      // Update value display
      const roundedValue = Math.round(newBottom);
      valueDisplay.textContent = roundedValue;

      // Log to terminal if significant change (every 10%)
      const significantChange = Math.abs(roundedValue - lastOutput) >= 10;
      if (significantChange) {
        const label = handle
          .closest(".slider-wrapper")
          .querySelector(".slider-label").textContent;
        addTerminalText(`ADJUSTING ${label}: ${roundedValue}%`, 10);
        lastOutput = roundedValue;

        // Play slider adjustment sound
        playSystemSound("slider-adjust");
      }

      // Update system state
      updateSystemState(
        handle.closest(".slider-wrapper").querySelector(".slider-label")
          .textContent,
        roundedValue,
      );

      // Update corresponding gauge if applicable
      updateGauges();
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        const label = handle
          .closest(".slider-wrapper")
          .querySelector(".slider-label").textContent;
        const value = Number.parseInt(
          handle.closest(".slider-wrapper").querySelector(".slider-value")
            .textContent,
        );
        addTerminalText(`${label} SET TO ${value}%`, 30, "text-blue");

        // Play slider release sound
        playSystemSound("slider-release");

        // Update system state
        updateSystemState(label, value);
      }
    });
  });
}

// Update gauge displays based on system state
function updateGauges() {
  // Update fuel gauge
  const fuelGauge = document.getElementById("fuel-gauge");
  if (fuelGauge) {
    fuelGauge.style.width = `${systemState.fuel}%`;
    // Change color based on level
    if (systemState.fuel < 20) {
      fuelGauge.style.backgroundColor = "var(--button-red)";
    } else if (systemState.fuel < 50) {
      fuelGauge.style.backgroundColor = "var(--button-yellow)";
    } else {
      fuelGauge.style.backgroundColor = "";
    }
  }

  // Update oxygen gauge
  const oxygenGauge = document.getElementById("oxygen-gauge");
  if (oxygenGauge) {
    oxygenGauge.style.width = `${systemState.oxygen}%`;
    if (systemState.oxygen < 20) {
      oxygenGauge.style.backgroundColor = "var(--button-red)";
    } else if (systemState.oxygen < 50) {
      oxygenGauge.style.backgroundColor = "var(--button-yellow)";
    } else {
      oxygenGauge.style.backgroundColor = "";
    }
  }

  // Update temperature gauge
  const tempGauge = document.getElementById("temp-gauge");
  if (tempGauge) {
    tempGauge.style.width = `${systemState.temperature}%`;
  }

  // Update pressure gauge
  const pressureGauge = document.getElementById("pressure-gauge");
  if (pressureGauge) {
    pressureGauge.style.width = `${systemState.pressure}%`;
  }
}

// Enhanced knobs functionality with angle tracking
function setupKnobs() {
  const knobs = document.querySelectorAll(".knob-dial");

  knobs.forEach((knob) => {
    let rotation = 0;
    let isDragging = false;
    let startAngle = 0;

    // Set initial marker position
    const marker = knob.querySelector(".knob-marker");
    if (marker) marker.style.transform = `translateX(-50%) rotate(0deg)`;

    knob.addEventListener("mousedown", (e) => {
      isDragging = true;
      const knobRect = knob.getBoundingClientRect();
      const knobCenterX = knobRect.left + knobRect.width / 2;
      const knobCenterY = knobRect.top + knobRect.height / 2;
      startAngle =
        (Math.atan2(e.clientY - knobCenterY, e.clientX - knobCenterX) * 180) /
        Math.PI;

      // Play knob grab sound
      playSystemSound("knob-grab");
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const knobRect = knob.getBoundingClientRect();
      const knobCenterX = knobRect.left + knobRect.width / 2;
      const knobCenterY = knobRect.top + knobRect.height / 2;

      const angle =
        (Math.atan2(e.clientY - knobCenterY, e.clientX - knobCenterX) * 180) /
        Math.PI;
      let newRotation = rotation + (angle - startAngle);

      // Limit rotation to 0-270 degrees
      newRotation = Math.max(0, Math.min(270, newRotation));

      const marker = knob.querySelector(".knob-marker");
      if (marker)
        marker.style.transform = `translateX(-50%) rotate(${newRotation}deg)`;

      startAngle = angle;
      rotation = newRotation;

      const label = knob.parentElement.querySelector(".knob-label").textContent;
      const value = Math.round((rotation / 270) * 100);

      // Only update the terminal occasionally to prevent spam
      if (Math.abs(newRotation - rotation) > 20) {
        addTerminalText(`ADJUSTING ${label}: ${value}%`, 10);

        // Play knob adjustment sound
        playSystemSound("knob-adjust");
      }

      // Update gauge that corresponds to this knob if it exists
      if (label === "THRUST") {
        systemState.thrustLevel = value;
        document.getElementById("fuel-gauge").style.width = `${
          100 - value / 2
        }%`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        const label =
          knob.parentElement.querySelector(".knob-label").textContent;
        const value = Math.round((rotation / 270) * 100);
        addTerminalText(`${label} SET TO ${value}%`, 30, "text-blue");

        // Play knob release sound
        playSystemSound("knob-release");
      }
    });
  });
}

// Enhanced switches with sounds and system effects
function setupSwitches() {
  const switches = document.querySelectorAll(".switch");

  switches.forEach((switchEl) => {
    switchEl.addEventListener("click", function () {
      this.classList.toggle("active");
      const label = this.nextElementSibling.textContent;
      const isEnabled = this.classList.contains("active");

      // Update system state
      switch (label) {
        case "POWER":
          systemState.power = isEnabled;
          break;
        case "COMMS":
          systemState.comms = isEnabled;
          break;
        case "NAV":
          systemState.nav = isEnabled;
          break;
        case "LIFE":
          systemState.life = isEnabled;
          break;
      }

      addTerminalText(
        `${label}: ${isEnabled ? "ENABLED" : "DISABLED"}`,
        30,
        isEnabled ? "text-green" : "text-red",
      );

      // Play switch sound
      playSystemSound(isEnabled ? "switch-on" : "switch-off");

      // If all systems are enabled, update status
      if (
        label === "LIFE" &&
        isEnabled &&
        systemState.power &&
        systemState.comms &&
        systemState.nav
      ) {
        setTimeout(() => {
          addTerminalText("ALL PRIMARY SYSTEMS ONLINE", 30, "text-green");
          statusReadout.textContent = "READY";
        }, 500);
      }

      // If a critical system is disabled, update status
      if (!isEnabled && (label === "POWER" || label === "LIFE")) {
        statusReadout.textContent = "WARNING";
        setTimeout(() => {
          addTerminalText(
            `WARNING: CRITICAL SYSTEM ${label} DISABLED`,
            30,
            "terminal-warning",
          );
        }, 500);
      }
    });
  });
}

// Enhanced launch functionality with countdown and animations
function setupLaunchSequence() {
  const launchCover = document.getElementById("launch-cover");
  const launchButton = document.getElementById("launch-button");

  launchCover.addEventListener("click", function () {
    this.classList.toggle("open");

    if (this.classList.contains("open")) {
      addTerminalText("LAUNCH SYSTEM ARMED", 30, "text-red");
      playSystemSound("cover-open");

      // Add flashing effect to the launch button
      launchButton.classList.add("armed");
    } else {
      addTerminalText("LAUNCH SYSTEM SAFE", 30, "text-green");
      playSystemSound("cover-close");

      // Remove flashing effect
      launchButton.classList.remove("armed");
    }
  });

  launchButton.addEventListener("click", () => {
    if (launchCover.classList.contains("open")) {
      // Check if all systems are ready
      if (
        systemState.power &&
        systemState.comms &&
        systemState.nav &&
        systemState.life
      ) {
        initiateLaunchSequence();
      } else {
        addTerminalText(
          "ERROR: NOT ALL PRIMARY SYSTEMS ARE ENABLED",
          30,
          "terminal-warning",
        );
        addTerminalText("LAUNCH ABORTED", 30, "terminal-critical");
        playSystemSound("error");
      }
    } else {
      addTerminalText(
        "ERROR: LAUNCH SYSTEM SAFETY ENGAGED",
        30,
        "terminal-warning",
      );
      playSystemSound("error");
    }
  });
}

// Improved launch sequence with more detailed events and effects
function initiateLaunchSequence() {
  // Prevent multiple launches
  if (systemState.launched) {
    addTerminalText("ERROR: ROCKET ALREADY LAUNCHED", 30, "terminal-warning");
    return;
  }

  addTerminalText("LAUNCH SEQUENCE INITIATED", 20, "text-yellow");
  statusReadout.textContent = "LAUNCHING";

  // Play launch prep sound
  playSystemSound("launch-prep");

  // Pre-launch checks
  const prelaunchChecks = [
    "ACTIVATING LAUNCH COMPUTER",
    "PRESSURIZING FUEL TANKS",
    "CHILLING TURBOPUMPS",
    "ARMING FLIGHT TERMINATION SYSTEM",
    "CLEARING LAUNCH PAD",
    "VERIFYING TRAJECTORY",
    "CHECKING WEATHER CONDITIONS",
    "FINAL GUIDANCE CALIBRATION",
    "ALL SYSTEMS GO FOR LAUNCH",
  ];

  let checkDelay = 500;
  prelaunchChecks.forEach((check, index) => {
    setTimeout(() => {
      addTerminalText(
        check,
        20,
        index === prelaunchChecks.length - 1 ? "text-green" : "",
      );
    }, checkDelay);
    checkDelay += 500;
  });

  // Start countdown after checks
  setTimeout(() => {
    // Start countdown
    let countdown = 10;
    addTerminalText("STARTING COUNTDOWN", 20, "text-yellow");

    const countdownInterval = setInterval(() => {
      countdownElement.textContent = `00:00:${countdown
        .toString()
        .padStart(2, "0")}`;

      // Add computer voice countdown effect with different terminal colors
      if (countdown <= 3) {
        addTerminalText(`T-MINUS ${countdown}`, 10, "terminal-critical");
      } else if (countdown <= 5) {
        addTerminalText(`T-MINUS ${countdown}`, 10, "terminal-warning");
      } else {
        addTerminalText(`T-MINUS ${countdown}`, 10, "text-yellow");
      }

      // Play countdown beep
      playSystemSound("countdown");

      // Terminal messages during countdown
      switch (countdown) {
        case 8:
          addTerminalText("IGNITION SEQUENCE START", 20);
          break;
        case 6:
          addTerminalText("INTERNAL POWER ENGAGED", 20);
          break;
        case 5:
          addTerminalText("WATER DELUGE SYSTEM ACTIVATED", 20);
          break;
        case 3:
          addTerminalText("MAIN ENGINE START", 20, "text-yellow");
          // Start screen shake effect
          document
            .querySelector(".console-container")
            .classList.add("shake-effect");
          break;
      }

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        launchRocket();
      }

      countdown--;
    }, 1000);
  }, 5000); // Start countdown after pre-launch checks
}

// Final rocket launch with visual and audio effects
function launchRocket() {
  systemState.launched = true;

  // Play launch sound
  playSystemSound("launch");

  // Intense shake effect
  document.querySelector(".console-container").classList.add("intense-shake");

  addTerminalText("IGNITION", 10, "terminal-critical");

  setTimeout(() => {
    addTerminalText("LIFTOFF", 10, "terminal-critical");

    // Update system status
    statusReadout.textContent = "IN FLIGHT";

    // Show rocket rising animation
    addRocketAnimation();

    setTimeout(() => {
      // Reduce shake effect
      document
        .querySelector(".console-container")
        .classList.remove("intense-shake");
      document.querySelector(".console-container").classList.add("mild-shake");

      addTerminalText("CLEARING TOWER", 20, "text-yellow");
    }, 2000);

    setTimeout(() => {
      addTerminalText("ROLL PROGRAM INITIATED", 20);

      // Stop shake effect
      document
        .querySelector(".console-container")
        .classList.remove("mild-shake");
    }, 4000);

    setTimeout(() => {
      addTerminalText("MAXIMUM DYNAMIC PRESSURE REACHED", 20);
      addTerminalText("ROCKET LAUNCH SUCCESSFUL", 20, "text-green");

      // Update telemetry data
      startTelemetryUpdates();
    }, 6000);
  }, 1000);
}

// Add visual rocket launch animation
function addRocketAnimation() {
  // Create a simple rocket animation div if it doesn't exist
  if (!document.getElementById("rocket-animation")) {
    const rocketDiv = document.createElement("div");
    rocketDiv.id = "rocket-animation";
    rocketDiv.innerHTML = `
  <div class="rocket">
    <div class="rocket-body">
      <div class="rocket-top"></div>
      <div class="rocket-window"></div>
      <div class="rocket-fins"></div>
      <div class="rocket-fire"></div>
    </div>
  </div>
`;
    document.body.appendChild(rocketDiv);

    // Add rocket animation styles
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
  #rocket-animation {
    position: fixed;
    bottom: -100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    pointer-events: none;
    animation: rocketLaunch 10s forwards;
  }
  .rocket {
    width: 40px;
    height: 100px;
  }
  .rocket-body {
    position: relative;
    width: 20px;
    height: 80px;
    background-color: #c0c0c0;
    margin: 0 auto;
    border-radius: 50% 50% 0 0;
  }
  .rocket-top {
    position: absolute;
    top: -20px;
    left: 0;
    width: 20px;
    height: 20px;
    background-color: #ff0000;
    border-radius: 50% 50% 0 0;
  }
  .rocket-window {
    position: absolute;
    top: 15px;
    left: 5px;
    width: 10px;
    height: 10px;
    background-color: #00bfff;
    border-radius: 50%;
  }
  .rocket-fins {
    position: absolute;
    bottom: 0;
    left: -10px;
    width: 40px;
    height: 20px;
  }
  .rocket-fins:before,
  .rocket-fins:after {
    content: '';
    position: absolute;
    width: 10px;
    height: 20px;
    background-color: #ff0000;
  }
  .rocket-fins:before {
    left: 0;
    transform: skewY(30deg);
  }
  .rocket-fins:after {
    right: 0;
    transform: skewY(-30deg);
  }
  .rocket-fire {
    position: absolute;
    bottom: -30px;
    left: 5px;
    width: 10px;
    height: 30px;
    background: linear-gradient(to bottom, #ffff00, #ff6600, transparent);
    border-radius: 0 0 50% 50%;
    animation: fire 0.2s infinite alternate;
  }
  @keyframes fire {
    from { height: 30px; }
    to { height: 40px; }
  }
  @keyframes rocketLaunch {
    0% { bottom: -100px; }
    10% { bottom: 10%; }
    100% { bottom: 120%; }
  }
  .shake-effect {
    animation: shake 0.5s infinite;
  }
  .intense-shake {
    animation: intenseShake 0.2s infinite;
  }
  .mild-shake {
    animation: shake 1s infinite;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  @keyframes intenseShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
    document.head.appendChild(styleEl);
  }
}

// Start telemetry updates after launch
function startTelemetryUpdates() {
  // Animate gauges to show flight in progress
  animateGauges();

  // Periodically update terminal with telemetry data
  const telemetryInterval = setInterval(() => {
    // Generate realistic telemetry data based on flight time
    const altitude = Math.min(
      100,
      systemState.altitude + Math.floor(Math.random() * 5),
    );
    const velocity = Math.min(
      100,
      systemState.speed + Math.floor(Math.random() * 3),
    );
    const fuel = Math.max(0, systemState.fuel - Math.floor(Math.random() * 2));

    // Update system state
    systemState.altitude = altitude;
    systemState.speed = velocity;
    systemState.fuel = fuel;

    // Update UI sliders to match telemetry
    updateSliderToValue("ALT", altitude);
    updateSliderToValue("SPEED", velocity);
    updateSliderToValue("FUEL", fuel);

    // Random telemetry messages
    if (Math.random() > 0.7) {
      const messages = [
        `ALTITUDE: ${altitude} KM`,
        `VELOCITY: ${velocity} KM/S`,
        `FUEL REMAINING: ${fuel}%`,
        `TRAJECTORY: NOMINAL`,
        `COMMUNICATIONS: STABLE`,
        `OXYGEN LEVELS: ${systemState.oxygen}%`,
        `HULL TEMPERATURE: ${systemState.temperature}°C`,
        `CABIN PRESSURE: ${systemState.pressure} KPA`,
      ];

      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      addTerminalText(`TELEMETRY: ${randomMessage}`, 20, "text-blue");
    }

    // Check if fuel is depleted
    if (fuel <= 0) {
      clearInterval(telemetryInterval);
      addTerminalText("MAIN ENGINE CUTOFF", 20, "text-yellow");
      addTerminalText("ENTERING ORBITAL TRAJECTORY", 20, "text-green");

      // Update status
      statusReadout.textContent = "ORBITAL";
    }

    // Update gauges
    updateGauges();
  }, 3000);
}

// Update a slider position to match a value
function updateSliderToValue(labelText, value) {
  const sliders = document.querySelectorAll(".slider-wrapper");
  sliders.forEach((slider) => {
    const label = slider.querySelector(".slider-label");
    if (label && label.textContent === labelText) {
      const handle = slider.querySelector(".slider-handle");
      const fill = slider.querySelector(".slider-fill");
      const valueDisplay = slider.querySelector(".slider-value");

      handle.style.bottom = `${value}%`;
      fill.style.height = `${value}%`;
      valueDisplay.textContent = value;
    }
  });
}

// Run diagnostics with detailed system check
function runDiagnostics() {
  if (systemState.diagnosticsRunning) {
    addTerminalText(
      "ERROR: DIAGNOSTICS ALREADY IN PROGRESS",
      30,
      "terminal-warning",
    );
    playSystemSound("error");
    return;
  }

  systemState.diagnosticsRunning = true;
  addTerminalText("RUNNING SYSTEM DIAGNOSTICS...", 30, "text-yellow");
  playSystemSound("diagnostics");

  // Flash diagnostics button
  const diagnosticsButton = document.getElementById("run-diagnostics");
  diagnosticsButton.classList.add("button-flash");
  setTimeout(() => {
    diagnosticsButton.classList.remove("button-flash");
  }, 300);

  // Define diagnostics checks
  const diagnosticsChecks = [
    {
      system: "FUEL SYSTEMS",
      status: systemState.fuel > 50 ? "OK" : "WARNING",
      delay: 800,
    },
    {
      system: "NAVIGATION",
      status: systemState.nav ? "OK" : "OFFLINE",
      delay: 800,
    },
    {
      system: "LIFE SUPPORT",
      status: systemState.life ? "OK" : "OFFLINE",
      delay: 800,
    },
    {
      system: "COMMUNICATION",
      status: systemState.comms ? "OK" : "OFFLINE",
      delay: 800,
    },
    {
      system: "POWER SYSTEMS",
      status: systemState.power ? "OK" : "OFFLINE",
      delay: 800,
    },
    {
      system: "OXYGEN LEVELS",
      status: systemState.oxygen > 50 ? "OK" : "WARNING",
      delay: 800,
    },
    { system: "HULL INTEGRITY", status: "OK", delay: 800 },
    { system: "GUIDANCE COMPUTER", status: "OK", delay: 800 },
  ];

  // Run each diagnostic check with delay
  let totalDelay = 0;
  let warnings = 0;
  let failures = 0;

  diagnosticsChecks.forEach((check, index) => {
    totalDelay += check.delay;

    setTimeout(() => {
      let statusClass = "";

      // Determine status class for coloring
      if (check.status === "OK") {
        statusClass = "text-green";
      } else if (check.status === "WARNING") {
        statusClass = "terminal-warning";
        warnings++;
      } else {
        statusClass = "terminal-critical";
        failures++;
      }

      // Show the diagnostic result
      addTerminalText(
        `CHECKING ${check.system}... ${check.status}`,
        20,
        statusClass,
      );

      // Play appropriate sound
      if (check.status === "OK") {
        playSystemSound("check-ok");
      } else {
        playSystemSound("check-warning");
      }

      // Final summary after all checks
      if (index === diagnosticsChecks.length - 1) {
        setTimeout(() => {
          if (failures > 0) {
            addTerminalText(
              `DIAGNOSTICS COMPLETE: ${failures} CRITICAL FAILURES, ${warnings} WARNINGS`,
              30,
              "terminal-critical",
            );
            statusReadout.textContent = "ERROR";
          } else if (warnings > 0) {
            addTerminalText(
              `DIAGNOSTICS COMPLETE: ${warnings} WARNINGS`,
              30,
              "terminal-warning",
            );
            statusReadout.textContent = "WARNING";
          } else {
            addTerminalText("ALL SYSTEMS NOMINAL", 30, "text-green");
            statusReadout.textContent = "READY";
          }

          // Reset diagnostics state
          systemState.diagnosticsRunning = false;
        }, 1000);
      }
    }, totalDelay);
  });
}

// Clear alarm function with visual feedback
function clearAlarm() {
  if (!systemState.alarmState) {
    addTerminalText("NO ACTIVE ALARMS", 30);
    return;
  }

  // Visual feedback for button
  const clearButton = document.getElementById("clear-alarm");
  clearButton.classList.add("button-flash");
  setTimeout(() => {
    clearButton.classList.remove("button-flash");
  }, 300);

  // Turn off LEDs
  const activeLeds = document.querySelectorAll(".led.active");
  activeLeds.forEach((led) => {
    led.classList.remove("active");
  });

  addTerminalText("ALARMS CLEARED", 30, "text-green");
  playSystemSound("alarm-clear");

  // Reset alarm state
  systemState.alarmState = false;
}

// Auto sequence with improved visual and audio feedback
function runAutoSequence() {
  addTerminalText("INITIATING AUTO SEQUENCE", 30, "text-yellow");
  playSystemSound("auto-sequence");

  // Visual feedback for button
  const autoButton = document.getElementById("auto-sequence");
  autoButton.classList.add("button-flash");
  setTimeout(() => {
    autoButton.classList.remove("button-flash");
  }, 300);

  // Define the auto sequence steps
  const sequenceSteps = [
    {
      action: "enableSwitch",
      id: "power-switch",
      message: "POWER: ENABLED",
      delay: 500,
    },
    {
      action: "enableSwitch",
      id: "comms-switch",
      message: "COMMS: ENABLED",
      delay: 500,
    },
    {
      action: "enableSwitch",
      id: "nav-switch",
      message: "NAV: ENABLED",
      delay: 500,
    },
    {
      action: "enableSwitch",
      id: "life-switch",
      message: "LIFE: ENABLED",
      delay: 500,
    },
    { action: "runDiagnostics", message: "RUNNING DIAGNOSTICS", delay: 1000 },
    { action: "updateStatus", message: "AUTO SEQUENCE COMPLETE", delay: 5000 },
  ];

  // Execute the sequence steps
  let totalDelay = 0;
  sequenceSteps.forEach((step) => {
    totalDelay += step.delay;

    setTimeout(() => {
      // Handle different action types
      switch (step.action) {
        case "enableSwitch":
          const switchEl = document.getElementById(step.id);
          if (switchEl && !switchEl.classList.contains("active")) {
            switchEl.click();
          } else {
            addTerminalText(step.message, 30, "text-green");
          }
          break;

        case "runDiagnostics":
          addTerminalText(step.message, 30);
          const diagnosticsButton = document.getElementById("run-diagnostics");
          if (diagnosticsButton) diagnosticsButton.click();
          break;

        case "updateStatus":
          addTerminalText(step.message, 30, "text-green");
          statusReadout.textContent = "READY";
          break;
      }
    }, totalDelay);
  });
}

// Start idle animations for visual interest
function startIdleAnimations() {
  // Random LED blinks
  setInterval(() => {
    if (!systemState.alarmState) {
      // Don't override alarm LEDs
      const leds = document.querySelectorAll(".led");
      leds.forEach((led) => {
        if (Math.random() > 0.7) {
          led.classList.toggle("active");
        }
      });
    }
  }, 800);

  // Subtle gauge fluctuations
  setInterval(() => {
    if (!systemState.launched) {
      // Don't fluctuate after launch
      const gauges = [
        document.getElementById("fuel-gauge"),
        document.getElementById("oxygen-gauge"),
        document.getElementById("temp-gauge"),
        document.getElementById("pressure-gauge"),
      ];

      gauges.forEach((gauge) => {
        if (gauge) {
          const currentWidth = Number.parseFloat(gauge.style.width || "50");
          let newWidth = currentWidth + (Math.random() * 2 - 1); // Subtle +/- 1% change
          newWidth = Math.max(5, Math.min(95, newWidth));
          gauge.style.width = `${newWidth}%`;
        }
      });
    }
  }, 3000);

  // Random terminal messages for ambiance
  setInterval(() => {
    if (Math.random() > 0.9) {
      const messages = [
        "TELEMETRY DATA RECEIVED",
        "SYSTEM CHECK: NOMINAL",
        "RADIATION LEVELS: NORMAL",
        "STABILIZERS: OPERATIONAL",
        "ORBIT PROJECTION: ON TARGET",
        "NETWORK PING: 32MS",
        "TEMPERATURE VARIANCE: ACCEPTABLE",
        "SIGNAL STRENGTH: 98%",
        "MEMORY USAGE: 42%",
        "SYSTEM UPTIME: " + formatUptime(),
      ];
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      addTerminalText(
        randomMessage,
        30,
        Math.random() > 0.8 ? "text-blue" : "",
      );
    }
  }, 10000);
}

// Format system uptime for terminal display
function formatUptime() {
  const now = new Date();
  const startTime = window.startTime || (window.startTime = now);
  const diff = Math.floor((now - startTime) / 1000);

  const hours = Math.floor(diff / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((diff % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(diff % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

// Play system sounds with fallbacks
function playSystemSound(soundType) {
  // In a real implementation, this would play actual sound effects
  // For this demonstration, we'll just simulate the sound types
  console.log(`Playing sound: ${soundType}`);

  // Create a simple audio context for beeps if browser supports it
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Different sound types
    switch (soundType) {
      case "countdown":
        playBeep(audioContext, 880, 0.1, 0.2); // High beep
        break;
      case "switch-on":
        playBeep(audioContext, 440, 0.1, 0.1); // Medium beep
        break;
      case "switch-off":
        playBeep(audioContext, 220, 0.1, 0.1); // Low beep
        break;
      case "alarm":
        // Alternating tones
        playBeep(audioContext, 880, 0.1, 0);
        setTimeout(() => playBeep(audioContext, 440, 0.1, 0), 200);
        setTimeout(() => playBeep(audioContext, 880, 0.1, 0), 400);
        break;
      case "error":
        playBeep(audioContext, 110, 0.3, 0); // Long low beep
        break;
      default:
        playBeep(audioContext, 440, 0.05, 0); // Default click sound
    }
  } catch (e) {
    // Browser doesn't support audio API, silently fail
    console.log("Audio not supported");
  }
}

// Helper function to play a beep sound
function playBeep(audioContext, frequency, duration, delay) {
  setTimeout(() => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    // Fade out for nicer sound
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration,
    );

    // Stop the sound
    setTimeout(() => {
      oscillator.stop();
    }, duration * 1000);
  }, delay * 1000);
}

// Fullscreen functionality
function setupFullscreenMode() {
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const consoleContainer = document.getElementById("console");

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullScreen);
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (consoleContainer.requestFullscreen) {
        consoleContainer.requestFullscreen();
      } else if (consoleContainer.webkitRequestFullscreen) {
        consoleContainer.webkitRequestFullscreen();
      } else if (consoleContainer.msRequestFullscreen) {
        consoleContainer.msRequestFullscreen();
      }

      if (fullscreenBtn) {
        fullscreenBtn.innerHTML = `<div class="fullscreen-icon"></div><span>EXIT</span>`;
        fullscreenBtn.classList.add("exit-fullscreen");
      }

      addTerminalText("ENTERING FULL OPERATIONAL MODE", 30, "text-green");
      playSystemSound("switch-on");
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      if (fullscreenBtn) {
        fullscreenBtn.innerHTML = `<div class="fullscreen-icon"></div><span>FULLSCREEN</span>`;
        fullscreenBtn.classList.remove("exit-fullscreen");
      }

      addTerminalText("EXITING FULL OPERATIONAL MODE", 30);
      playSystemSound("switch-off");
    }
  }

  // Listen for fullscreen change
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  function handleFullscreenChange() {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      // Exited fullscreen
      if (fullscreenBtn) {
        fullscreenBtn.innerHTML = `<div class="fullscreen-icon"></div><span>FULLSCREEN</span>`;
        fullscreenBtn.classList.remove("exit-fullscreen");
      }
    }

    // Resize console to fit screen
    resizeConsole();
  }
}

// Auto-fit console to screen on load and resize
function resizeConsole() {
  const consoleContainer = document.getElementById("console");

  if (!consoleContainer) return;

  if (document.fullscreenElement) {
    consoleContainer.style.height = "100vh";
    consoleContainer.style.width = "100vw";
  } else {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (windowWidth < 768) {
      consoleContainer.style.height = "auto";
      consoleContainer.style.width = "95vw";
    } else {
      consoleContainer.style.height = "95vh";
      consoleContainer.style.width = "95vw";
    }
  }
}

// Set up keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // 'F' key for fullscreen
    if (e.key === "f" || e.key === "F") {
      toggleFullScreen();
    }

    // 'Esc' key for exiting fullscreen (redundant with browser behavior, but for UI feedback)
    if (e.key === "Escape" && document.fullscreenElement) {
      addTerminalText("EXITING FULL OPERATIONAL MODE", 30);
    }

    // 'D' key for diagnostics
    if (e.key === "d" || e.key === "D") {
      runDiagnostics();
    }

    // 'C' key for clearing alarms
    if (e.key === "c" || e.key === "C") {
      clearAlarm();
    }

    // 'A' key for auto sequence
    if (e.key === "a" || e.key === "A") {
      runAutoSequence();
    }
  });
}

// Initialize all enhanced functionality
function initializeConsole() {
  console.log("Initializing Rocket Control Console...");

  // Record start time for uptime calculation
  window.startTime = new Date();

  // Add terminal style enhancements
  addTerminalStyles();

  // Set up components
  setupPresetMenus();
  setupPresetButtons();
  setupSliders();
  setupKnobs();
  setupSwitches();
  setupLaunchSequence();
  setupFullscreenMode();
  setupKeyboardShortcuts();

  // Add event listeners for control buttons
  document
    .getElementById("run-diagnostics")
    ?.addEventListener("click", runDiagnostics);
  document.getElementById("clear-alarm")?.addEventListener("click", clearAlarm);
  document
    .getElementById("auto-sequence")
    ?.addEventListener("click", runAutoSequence);

  // Initial resize for responsive layout
  window.addEventListener("resize", resizeConsole);
  resizeConsole();

  // Run system boot sequence
  systemBoot();

  // Add enhanced indicators initialization at the end
  initializeEnhancedIndicators();

  updateInitializeConsole();
}

// Run initialization when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeConsole);
} else {
  initializeConsole();
}

// Enhanced indicator animations for Retro Rocket Control Console
// Add this code to the existing script.js file

// Make LEDs more dynamic with realistic patterns
function enhancedLedAnimations() {
  const leds = document.querySelectorAll(".led");

  // Assign different behaviors to LEDs
  leds.forEach((led, index) => {
    // Give each LED a specific purpose and behavior
    switch (index) {
      case 0: // Power indicator - steady when on
        led.classList.add("power-led");
        if (systemState.power) {
          led.classList.add("active");
          led.style.backgroundColor = "var(--led-green)";
        }
        break;
      case 1: // Comms indicator - blinks occasionally
        led.classList.add("comms-led");
        if (systemState.comms) {
          setInterval(() => {
            if (Math.random() > 0.7) {
              led.classList.toggle("active");
              led.style.backgroundColor = led.classList.contains("active")
                ? "var(--led-green)"
                : "var(--led-off)";
            }
          }, 800);
        }
        break;
      case 2: // Warning indicator - yellow, blinks when any value is in warning range
        led.classList.add("warning-led");
        setInterval(() => {
          const warningCondition =
            systemState.fuel < 40 ||
            systemState.oxygen < 40 ||
            systemState.temperature > 70 ||
            systemState.pressure < 30 ||
            systemState.pressure > 85;

          if (warningCondition) {
            led.classList.toggle("active");
            led.style.backgroundColor = led.classList.contains("active")
              ? "#ffaa00"
              : "var(--led-off)";
          } else {
            led.classList.remove("active");
            led.style.backgroundColor = "var(--led-off)";
          }
        }, 500);
        break;
      case 3: // Critical indicator - red, blinks quickly when any critical value
        led.classList.add("critical-led");
        setInterval(() => {
          const criticalCondition =
            systemState.fuel < 20 ||
            systemState.oxygen < 20 ||
            systemState.temperature > 90 ||
            systemState.pressure < 15 ||
            systemState.pressure > 95;

          if (criticalCondition) {
            led.classList.toggle("active");
            led.style.backgroundColor = led.classList.contains("active")
              ? "var(--led-red)"
              : "var(--led-off)";
          } else {
            led.classList.remove("active");
            led.style.backgroundColor = "var(--led-off)";
          }
        }, 250);
        break;
      case 4: // Navigation status - pulses slowly when active
        led.classList.add("nav-led");
        if (systemState.nav) {
          led.classList.add("pulsing");
          led.style.backgroundColor = "var(--led-green)";
        }
        break;
      case 5: // Life support status - steady green when good, yellow when moderate
        led.classList.add("life-led");
        setInterval(() => {
          if (systemState.life) {
            if (systemState.oxygen > 70) {
              led.classList.add("active");
              led.style.backgroundColor = "var(--led-green)";
            } else if (systemState.oxygen > 40) {
              led.classList.add("active");
              led.style.backgroundColor = "#ffaa00";
            } else {
              led.classList.add("active");
              led.style.backgroundColor = "var(--led-red)";
            }
          } else {
            led.classList.remove("active");
            led.style.backgroundColor = "var(--led-off)";
          }
        }, 1000);
        break;
      case 6: // Thrust indicator - blinks when thrust is high
        led.classList.add("thrust-led");
        setInterval(() => {
          if (systemState.thrustLevel > 80) {
            led.classList.toggle("active");
            led.style.backgroundColor = led.classList.contains("active")
              ? "var(--led-red)"
              : "var(--led-off)";
          } else if (systemState.thrustLevel > 60) {
            led.classList.add("active");
            led.style.backgroundColor = "#ffaa00";
          } else {
            led.classList.remove("active");
            led.style.backgroundColor = "var(--led-off)";
          }
        }, 300);
        break;
      case 7: // System status - green when all systems nominal, otherwise off
        led.classList.add("system-led");
        setInterval(() => {
          const allSystemsNominal =
            systemState.power &&
            systemState.comms &&
            systemState.nav &&
            systemState.life &&
            systemState.fuel > 30 &&
            systemState.oxygen > 30;

          if (allSystemsNominal) {
            led.classList.add("active");
            led.style.backgroundColor = "var(--led-green)";
          } else {
            led.classList.remove("active");
            led.style.backgroundColor = "var(--led-off)";
          }
        }, 1000);
        break;
    }
  });
}

// Enhanced temperature and pressure gauge animations
function enhancedGaugeAnimations() {
  // Get gauge elements
  const tempGauge = document.getElementById("temp-gauge");
  const pressureGauge = document.getElementById("pressure-gauge");

  if (!tempGauge || !pressureGauge) return;

  // Add fluctuation to temperature based on thrust and system activity
  setInterval(() => {
    // Temperature rises with thrust level
    let tempTarget = systemState.temperature;

    // If thrust is high, temperature rises
    if (systemState.thrustLevel > 70) {
      tempTarget += (systemState.thrustLevel - 70) / 10;
    }

    // Random micro-fluctuations
    const tempRandom = Math.random() * 6 - 3;
    let newTemp = Math.max(10, Math.min(100, tempTarget + tempRandom));

    // If engines are running, temperature fluctuates more
    if (systemState.launched) {
      newTemp += Math.sin(Date.now() / 1000) * 5;
    }

    // Smooth transition to new temperature
    systemState.temperature = systemState.temperature * 0.95 + newTemp * 0.05;

    // Update gauge
    tempGauge.style.width = `${systemState.temperature}%`;

    // Change color based on temperature
    if (systemState.temperature > 80) {
      tempGauge.style.backgroundColor = "var(--button-red)";
    } else if (systemState.temperature > 60) {
      tempGauge.style.backgroundColor = "var(--button-yellow)";
    } else {
      tempGauge.style.backgroundColor = "var(--button-green)";
    }
  }, 200);

  // Add fluctuation to pressure based on altitude and oxygen usage
  setInterval(() => {
    let pressureTarget = systemState.pressure;

    // Pressure fluctuates more during ascent
    if (systemState.launched && systemState.altitude < 50) {
      pressureTarget += Math.sin(Date.now() / 500) * 10;
    }

    // Pressure decreases with altitude
    if (systemState.altitude > 60) {
      pressureTarget -= (systemState.altitude - 60) / 10;
    }

    // Random micro-fluctuations
    const pressureRandom = Math.random() * 4 - 2;
    const newPressure = Math.max(
      5,
      Math.min(100, pressureTarget + pressureRandom),
    );

    // Smooth transition
    systemState.pressure = systemState.pressure * 0.9 + newPressure * 0.1;

    // Update gauge
    pressureGauge.style.width = `${systemState.pressure}%`;

    // Change color based on pressure
    if (systemState.pressure < 20 || systemState.pressure > 90) {
      pressureGauge.style.backgroundColor = "var(--button-red)";
    } else if (systemState.pressure < 40 || systemState.pressure > 80) {
      pressureGauge.style.backgroundColor = "var(--button-yellow)";
    } else {
      pressureGauge.style.backgroundColor = "var(--button-green)";
    }
  }, 300);
}

// Enhanced animation styles
function addEnhancedStyles() {
  if (!document.getElementById("enhanced-indicator-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "enhanced-indicator-styles";
    styleEl.innerHTML = `
      .led.pulsing {
        animation: pulse-led 2s infinite;
      }
      @keyframes pulse-led {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.4; }
      }
      
      .gauge-value {
        transition: width 0.2s, background-color 0.5s;
      }
      
      .slider-fill {
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      
      /* Temperature gauge animations */
      #temp-gauge {
        background: linear-gradient(to right, var(--button-green), var(--button-yellow), var(--button-red));
        position: relative;
      }
      
      #temp-gauge::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right, 
          rgba(255,255,255,0.1), 
          rgba(255,255,255,0.2), 
          rgba(255,255,255,0.1)
        );
        animation: temp-shimmer 2s infinite;
      }
      
      @keyframes temp-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      /* Pressure gauge pulsing effect */
      #pressure-gauge {
        animation: pressure-pulse 3s infinite;
      }
      
      @keyframes pressure-pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// Update the existing system state with more detailed properties
function enhanceSystemState() {
  // Extend the existing system state with more properties
  systemState.engineVibration = 0;
  systemState.hullIntegrity = 100;
  systemState.powerFluctuation = 0;

  // Add complex relationships between system properties
  setInterval(() => {
    // Engine vibration increases with thrust
    if (systemState.thrustLevel > 60) {
      systemState.engineVibration = (systemState.thrustLevel - 60) / 2;
    } else {
      systemState.engineVibration = 0;
    }

    // Hull integrity decreases with high temperature and vibration
    if (systemState.temperature > 75 && systemState.engineVibration > 10) {
      systemState.hullIntegrity -= 0.1;
    }

    // Power fluctuates occasionally
    if (Math.random() > 0.95) {
      systemState.powerFluctuation = Math.random() * 20;
      setTimeout(() => {
        systemState.powerFluctuation = 0;
      }, 2000);
    }

    // These state changes can trigger LED and gauge updates
    updateIndicatorsBasedOnSystemState();
  }, 1000);
}

// Update indicators based on system state
function updateIndicatorsBasedOnSystemState() {
  // Update any LEDs that should react to system state changes
  document.querySelectorAll(".led").forEach((led, index) => {
    // Power fluctuation affects first LED
    if (index === 0 && systemState.powerFluctuation > 10) {
      led.classList.toggle("active");
    }

    // Hull integrity affects another LED
    if (index === 4 && systemState.hullIntegrity < 50) {
      led.style.backgroundColor = "var(--led-red)";
      led.classList.add("active");
    }
  });

  // Update temperature and pressure based on system changes
  if (systemState.engineVibration > 15) {
    // High vibration increases temperature
    systemState.temperature += 0.5;
  }

  if (systemState.launched && systemState.altitude > 50) {
    // Pressure drops more in high altitude
    systemState.pressure = Math.max(10, systemState.pressure - 0.2);
  }

  // Update gauges
  updateGauges();
}

// Initialize the enhanced indicator behaviors
function initializeEnhancedIndicators() {
  console.log("Initializing enhanced indicators...");
  addEnhancedStyles();
  enhancedLedAnimations();
  enhancedGaugeAnimations();
  enhanceSystemState();

  // Log initialization to terminal
  addTerminalText("ENHANCED INDICATOR SYSTEMS ACTIVATED", 30, "text-green");
}

// Keyboard module functionality for Retro Rocket Control Console

// Create keyboard module UI
function createKeyboardModule() {
  // Create the keyboard module container
  const keyboardModule = document.createElement("div");
  keyboardModule.className = "console-panel keyboard-module";

  // Add panel title
  const panelTitle = document.createElement("h2");
  panelTitle.className = "panel-title";
  panelTitle.textContent = "KEYBOARD INTERFACE";
  keyboardModule.appendChild(panelTitle);

  // Create key rows
  const qwertRow = document.createElement("div");
  qwertRow.className = "key-row";

  const asdfgRow = document.createElement("div");
  asdfgRow.className = "key-row";

  // Create the QWERT keys
  const qwertKeys = ["Q", "W", "E", "R", "T"];
  qwertKeys.forEach((letter) => {
    const key = createKey(letter);
    qwertRow.appendChild(key);
  });

  // Create the ASDFG keys
  const asdfgKeys = ["A", "S", "D", "F", "G"];
  asdfgKeys.forEach((letter) => {
    const key = createKey(letter);
    asdfgRow.appendChild(key);
  });

  // Key status display
  const statusDisplay = document.createElement("div");
  statusDisplay.className = "key-status-display";
  statusDisplay.innerHTML = "<span>AWAITING INPUT</span>";

  // Add rows to module
  keyboardModule.appendChild(qwertRow);
  keyboardModule.appendChild(asdfgRow);
  keyboardModule.appendChild(statusDisplay);

  // Add the keyboard module to the page
  // Find the appropriate place to insert it (after the LED panel)
  const ledPanel = document.querySelector(".led-panel");
  if (ledPanel) {
    ledPanel.parentNode.insertBefore(keyboardModule, ledPanel.nextSibling);
  } else {
    // Fallback: Add to the first console panel
    const firstPanel = document.querySelector(".console-panel");
    if (firstPanel) {
      firstPanel.appendChild(keyboardModule);
    }
  }

  return keyboardModule;
}

// Create a single key element
function createKey(letter) {
  const key = document.createElement("div");
  key.className = "keyboard-key";
  key.dataset.key = letter.toLowerCase();
  key.textContent = letter;
  return key;
}

// Set up keyboard event listeners
function setupKeyboardListeners() {
  const targetKeys = ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g"];
  const statusDisplay = document.querySelector(".key-status-display span");

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (targetKeys.includes(key)) {
      // Find the corresponding key element
      const keyElement = document.querySelector(
        `.keyboard-key[data-key="${key}"]`,
      );

      if (keyElement) {
        // Add pressed class for visual feedback
        keyElement.classList.add("key-pressed");

        // Update terminal with key press
        addTerminalText(`KEY PRESS: ${key.toUpperCase()}`, 10, "text-yellow");

        // Update status display
        statusDisplay.textContent = `KEY ${key.toUpperCase()} ACTIVATED`;

        // Play key sound
        playSystemSound("key-press");

        // Activate a random LED for visual feedback
        activateRandomLED();
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (targetKeys.includes(key)) {
      // Find the corresponding key element
      const keyElement = document.querySelector(
        `.keyboard-key[data-key="${key}"]`,
      );

      if (keyElement) {
        // Remove pressed class
        keyElement.classList.remove("key-pressed");

        // Update status display after a short delay
        setTimeout(() => {
          statusDisplay.textContent = "AWAITING INPUT";
        }, 500);

        // Play key release sound
        playSystemSound("key-release");
      }
    }
  });
}

// Activate a random LED when a key is pressed for visual feedback
function activateRandomLED() {
  const leds = document.querySelectorAll(".led");
  if (leds.length > 0) {
    // Get a random LED
    const randomLED = leds[Math.floor(Math.random() * leds.length)];

    // Briefly activate it
    randomLED.classList.add("active");
    randomLED.style.backgroundColor = getRandomLEDColor();

    // Deactivate after a short delay
    setTimeout(() => {
      randomLED.classList.remove("active");
      randomLED.style.backgroundColor = "";
    }, 300);
  }
}

// Get a random LED color
function getRandomLEDColor() {
  const colors = [
    "var(--led-red)",
    "var(--led-green)",
    "#ffaa00", // Amber
    "#00aaff", // Blue
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

// Add key press sounds to the existing sound system
function enhanceSoundsForKeyboard() {
  // Extend the playSystemSound function if it exists
  const originalPlaySystemSound = window.playSystemSound || (() => {});

  window.playSystemSound = (soundType) => {
    // Handle keyboard sounds
    if (soundType === "key-press" || soundType === "key-release") {
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();

        if (soundType === "key-press") {
          playBeep(audioContext, 660, 0.03, 0);
        } else {
          playBeep(audioContext, 440, 0.02, 0);
        }
      } catch (e) {
        console.log("Audio not supported");
      }
      return;
    }

    // Call the original function for other sound types
    originalPlaySystemSound(soundType);
  };
}

// Initialize keyboard module
function initializeKeyboardModule() {
  // Create the UI
  createKeyboardModule();

  // Setup event listeners
  setupKeyboardListeners();

  // Enhance sound system
  enhanceSoundsForKeyboard();

  // Add to terminal
  addTerminalText("KEYBOARD INTERFACE INITIALIZED", 30, "text-green");

  // Add click handlers for on-screen keys (for touch devices)
  setupOnScreenKeyClicks();
}

// Allow clicking the keys on screen (for touch devices)
function setupOnScreenKeyClicks() {
  const keys = document.querySelectorAll(".keyboard-key");

  keys.forEach((key) => {
    key.addEventListener("mousedown", function () {
      const keyValue = this.dataset.key;

      // Simulate keydown event
      const event = new KeyboardEvent("keydown", {
        key: keyValue,
      });
      document.dispatchEvent(event);
    });

    key.addEventListener("mouseup", function () {
      const keyValue = this.dataset.key;

      // Simulate keyup event
      const event = new KeyboardEvent("keyup", {
        key: keyValue,
      });
      document.dispatchEvent(event);
    });

    // For touch devices
    key.addEventListener("touchstart", function (e) {
      e.preventDefault();
      const keyValue = this.dataset.key;

      // Simulate keydown event
      const event = new KeyboardEvent("keydown", {
        key: keyValue,
      });
      document.dispatchEvent(event);
    });

    key.addEventListener("touchend", function (e) {
      e.preventDefault();
      const keyValue = this.dataset.key;

      // Simulate keyup event
      const event = new KeyboardEvent("keyup", {
        key: keyValue,
      });
      document.dispatchEvent(event);
    });
  });
}

// Add initialization to the main console initialization
function updateInitializeConsole() {
  // This should be called from the main initializeConsole function
  // or directly as a separate initialization step
  initializeKeyboardModule();
}

// Call this function after the document is loaded
// Either add this line to the existing initialization code
// or call it separately
// updateInitializeConsole();
