const slides = [...document.querySelectorAll(".slide")];
const progressBar = document.getElementById("progressBar");
const currentSlide = document.getElementById("currentSlide");
const totalSlides = document.getElementById("totalSlides");
const dotNav = document.getElementById("dotNav");
const canvas = document.getElementById("ambient");
const ctx = canvas.getContext("2d");

let activeIndex = 0;
let width = 0;
let height = 0;
let particles = [];
let matrixColumns = [];
let pointer = { x: 0, y: 0 };
let lastTouchX = 0;
let lastTouchY = 0;

totalSlides.textContent = String(slides.length).padStart(2, "0");
buildMatrixRain();

slides.forEach((slide, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Gå til slide ${index + 1}: ${slide.dataset.title}`);
  dot.addEventListener("click", (event) => {
    event.stopPropagation();
    goTo(index);
  });
  dotNav.appendChild(dot);
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    button.dataset.go === "next" ? nextSlide() : previousSlide();
  });
});

document.querySelectorAll(".truth-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    const isFlipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isFlipped));
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("button, a, input, textarea, select")) return;
  nextSlide();
});

document.addEventListener("keydown", (event) => {
  const nextKeys = ["ArrowRight", "PageDown", " ", "Enter"];
  const prevKeys = ["ArrowLeft", "PageUp", "Backspace"];

  if (nextKeys.includes(event.key)) {
    event.preventDefault();
    nextSlide();
  }

  if (prevKeys.includes(event.key)) {
    event.preventDefault();
    previousSlide();
  }
});

document.addEventListener(
  "touchstart",
  (event) => {
    lastTouchX = event.changedTouches[0].clientX;
    lastTouchY = event.changedTouches[0].clientY;
  },
  { passive: true },
);

document.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - lastTouchX;
    const dy = touch.clientY - lastTouchY;

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? nextSlide() : previousSlide();
    }
  },
  { passive: true },
);

document.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
  pointer.y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
  document.documentElement.style.setProperty("--mx", pointer.x.toFixed(3));
  document.documentElement.style.setProperty("--my", pointer.y.toFixed(3));
});

window.addEventListener("resize", resizeCanvas);

function nextSlide() {
  goTo((activeIndex + 1) % slides.length);
}

function previousSlide() {
  goTo((activeIndex - 1 + slides.length) % slides.length);
}

function goTo(index) {
  activeIndex = index;
  const activeTheme = slides[activeIndex].dataset.theme;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeIndex);
    slide.classList.toggle("is-before", slideIndex < activeIndex);
  });

  [...dotNav.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeIndex);
    dot.setAttribute("aria-current", dotIndex === activeIndex ? "step" : "false");
  });

  document.body.dataset.theme = activeTheme;
  currentSlide.textContent = String(activeIndex + 1).padStart(2, "0");
  progressBar.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const particleCount = width < 720 ? 42 : 72;
  particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.34,
    vy: (Math.random() - 0.5) * 0.34,
    size: Math.random() * 1.8 + 0.6,
  }));

  const fontSize = 18;
  matrixColumns = Array.from({ length: Math.ceil(width / fontSize) }, () => Math.random() * height);
}

function buildMatrixRain() {
  const rain = document.querySelector(".matrix-rain");
  if (!rain) return;

  const glyphs = ["010110", "KEN", "AI", "変換", "DIGITAL", "101", "WAKE", "BUILD", "DATA", "未来"];
  const columns = 34;

  rain.innerHTML = "";
  for (let index = 0; index < columns; index += 1) {
    const span = document.createElement("span");
    const text = Array.from({ length: 12 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join("\n");

    span.textContent = text;
    span.style.setProperty("--x", `${(index / columns) * 100 + Math.random() * 2}%`);
    span.style.setProperty("--delay", `${Math.random() * -8}s`);
    span.style.setProperty("--speed", `${7 + Math.random() * 7}s`);
    rain.appendChild(span);
  }
}

function getThemeColors() {
  const styles = getComputedStyle(slides[activeIndex]);
  return {
    bg: styles.getPropertyValue("--bg").trim() || "#08111d",
    accent: styles.getPropertyValue("--accent").trim() || "#6ff7d2",
    accent2: styles.getPropertyValue("--accent-2").trim() || "#f8c45c",
  };
}

function drawNetwork(colors) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  particles.forEach((particle) => {
    particle.x += particle.vx + pointer.x * 0.08;
    particle.y += particle.vy + pointer.y * 0.08;

    if (particle.x < -10) particle.x = width + 10;
    if (particle.x > width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = height + 10;
    if (particle.y > height + 10) particle.y = -10;
  });

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 135) {
        ctx.strokeStyle = hexToRgba(colors.accent, 0.14 * (1 - distance / 135));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  particles.forEach((particle, index) => {
    ctx.fillStyle = hexToRgba(index % 3 === 0 ? colors.accent2 : colors.accent, 0.42);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = "source-over";
}

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 9, 5, 0.19)";
  ctx.fillRect(0, 0, width, height);
  ctx.font = "18px Courier New, monospace";
  ctx.fillStyle = "rgba(69, 255, 127, 0.72)";

  const glyphs = "01KENAIデジタル変換";
  matrixColumns.forEach((y, index) => {
    const text = glyphs[Math.floor(Math.random() * glyphs.length)];
    const x = index * 18;
    ctx.fillText(text, x, y);
    matrixColumns[index] = y > height + Math.random() * 1000 ? 0 : y + 18;
  });
}

function animate() {
  const colors = getThemeColors();

  if (slides[activeIndex].dataset.theme === "matrix") {
    drawMatrix();
  } else {
    drawNetwork(colors);
  }

  requestAnimationFrame(animate);
}

function hexToRgba(color, alpha) {
  if (!color.startsWith("#")) return color;

  const value = color.slice(1);
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  const number = Number.parseInt(normalized, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

resizeCanvas();
goTo(0);
animate();
