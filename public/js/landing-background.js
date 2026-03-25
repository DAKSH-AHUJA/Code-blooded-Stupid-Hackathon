(function () {
  const stage = document.getElementById("landingBounceStage");
  if (!stage) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const catPalettes = [
    { fur: "#b8b1a6", inner: "#f0d8c0", nose: "#8d6e63", eye: "#253044", bg: "rgba(255,255,255,0.08)" },
    { fur: "#8f98a8", inner: "#d9dde5", nose: "#6d7481", eye: "#202838", bg: "rgba(143,166,255,0.1)" },
    { fur: "#7e8791", inner: "#d7cec2", nose: "#8a6b65", eye: "#1d2533", bg: "rgba(246,214,110,0.08)" },
    { fur: "#c3b39f", inner: "#f2dcc4", nose: "#9f7f76", eye: "#2a3142", bg: "rgba(255,255,255,0.06)" }
  ];

  const items = [];
  let width = window.innerWidth;
  let height = window.innerHeight;
  let rafId = 0;

  function catSvg({ fur, inner, nose, eye, bg }) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" rx="28" fill="${bg}"/>
        <path d="M27 45L39 24L55 41" fill="${fur}"/>
        <path d="M93 45L81 24L65 41" fill="${fur}"/>
        <ellipse cx="60" cy="64" rx="34" ry="31" fill="${fur}"/>
        <ellipse cx="60" cy="73" rx="17" ry="14" fill="${inner}"/>
        <ellipse cx="47" cy="61" rx="4.8" ry="6.6" fill="${eye}"/>
        <ellipse cx="73" cy="61" rx="4.8" ry="6.6" fill="${eye}"/>
        <path d="M60 69L54.5 74H65.5L60 69Z" fill="${nose}"/>
        <path d="M60 74C58 78 55 79.5 52 79.5" stroke="${nose}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60 74C62 78 65 79.5 68 79.5" stroke="${nose}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M44 72H28" stroke="${nose}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
        <path d="M44 77H30" stroke="${nose}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
        <path d="M76 72H92" stroke="${nose}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
        <path d="M76 77H90" stroke="${nose}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
      </svg>
    `.trim();
  }

  function svgDataUrl(palette) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(catSvg(palette))}`;
  }

  function itemCount() {
    if (width < 640) return 8;
    if (width < 1024) return 12;
    return 16;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createCat() {
    const element = document.createElement("img");
    element.className = "landing-bounce-cat";
    const palette = catPalettes[Math.floor(Math.random() * catPalettes.length)];
    element.src = svgDataUrl(palette);
    element.alt = "";
    element.style.background = "transparent";
    element.style.border = "0";
    element.style.boxShadow = "none";
    element.style.backdropFilter = "none";
    stage.appendChild(element);

    const size = randomBetween(56, 84);
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.borderRadius = `${Math.round(size * 0.3)}px`;

    return {
      element,
      size,
      x: randomBetween(0, Math.max(12, width - size)),
      y: randomBetween(0, Math.max(12, height - size)),
      vx: randomBetween(-1.2, 1.2) || 0.6,
      vy: randomBetween(-0.7, 0.7) || -0.5,
      rotation: randomBetween(-8, 8),
      vr: randomBetween(-0.08, 0.08)
    };
  }

  function syncCount() {
    const desired = itemCount();

    while (items.length < desired) {
      items.push(createCat());
    }

    while (items.length > desired) {
      const removed = items.pop();
      removed.element.remove();
    }
  }

  function updateBounds() {
    width = window.innerWidth;
    height = window.innerHeight;
    syncCount();
  }

  function animate() {
    for (const item of items) {
      item.x += item.vx;
      item.y += item.vy;
      item.rotation += item.vr;

      if (item.x <= 0 || item.x >= width - item.size) {
        item.vx *= -1;
        item.x = Math.max(0, Math.min(item.x, width - item.size));
      }

      if (item.y <= 0 || item.y >= height - item.size) {
        item.vy *= -1;
        item.y = Math.max(0, Math.min(item.y, height - item.size));
      }

      item.element.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
    }

    rafId = window.requestAnimationFrame(animate);
  }

  updateBounds();
  animate();

  window.addEventListener("resize", updateBounds);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(rafId), { once: true });
})();
