import { drawAvatar } from "/js/avatar.js";

function buildTopNav({ backHref = "", pageTitle = "ItExists" } = {}) {
  const backButton = backHref
    ? `<a href="${backHref}" class="action-button action-button-ghost">&larr; Back</a>`
    : `<div></div>`;

  return `
    <header class="topnav-shell page-pop">
      <div class="topnav-left">
        ${backButton}
        <h1 class="glitch text-4xl" data-text="${pageTitle}">${pageTitle}</h1>
      </div>
      <div class="topnav-right">
        <button id="profileBtn" class="identity-chip hover-pop">
          <div class="identity-art">
            <img id="profileDoodle" class="identity-doodle hidden" alt="Profile doodle" />
            <canvas id="profileAvatar" width="48" height="48" class="identity-canvas"></canvas>
          </div>
          <div class="text-left">
            <span id="profileNick" class="block font-semibold leading-tight"></span>
            <span id="profileName" class="block text-xs uppercase tracking-[0.2em] text-[#f7f2ea]/55 mt-1"></span>
          </div>
        </button>
        <button id="logoutBtn" class="action-button action-button-ghost">Logout</button>
      </div>
    </header>
    <div id="reportModal" class="hidden report-modal">
      <div class="report-modal-panel modal-pop">
        <h3 class="text-2xl mb-4">Your Shame Report</h3>
        <p class="mb-2">Confidence Level (Critically Low)</p>
        <div class="report-progress-track">
          <div id="esteemBar" class="report-progress-fill"></div>
        </div>
        <p class="mb-1">Game High Score: <span id="reportScore">0</span></p>
        <p class="mb-1">Times Roasted: <span id="reportRoasts">0</span></p>
        <p class="mb-3">Stupidity Score: <span id="reportStupidity">0</span></p>
        <button id="closeModalBtn" class="action-button action-button-primary">
          Close
        </button>
      </div>
    </div>
  `;
}

function safeParseTraits(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getStoredValue(primaryKey, legacyKey, fallback = "") {
  return localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey) || fallback;
}

function setEsteemBar(value) {
  const bar = document.getElementById("esteemBar");
  if (!bar) return;

  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  bar.style.width = `${clamped}%`;
  if (clamped > 65) bar.style.background = "#27ae60";
  else if (clamped > 35) bar.style.background = "#f1c40f";
  else bar.style.background = "#c0392b";
}

async function refreshReport(userId) {
  try {
    const response = await fetch(`/api/user/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    const user = await response.json();

    setEsteemBar(user.self_esteem);
    document.getElementById("reportScore").textContent = String(user.game_score || 0);
    document.getElementById("reportRoasts").textContent = String(user.roast_count || 0);
    const stupidity = (100 - Number(user.self_esteem || 0)) + Number(user.roast_count || 0) * 5;
    document.getElementById("reportStupidity").textContent = String(stupidity);
  } catch (_error) {
    document.getElementById("reportScore").textContent = "0";
    document.getElementById("reportRoasts").textContent = "0";
    document.getElementById("reportStupidity").textContent = "0";
  }
}

function renderIdentityArt(traits) {
  const doodle = document.getElementById("profileDoodle");
  const canvas = document.getElementById("profileAvatar");
  if (!doodle || !canvas) return;

  if (traits?.doodlePath) {
    doodle.src = traits.doodlePath;
    doodle.classList.remove("hidden");
    canvas.classList.add("hidden");
    return;
  }

  doodle.classList.add("hidden");
  canvas.classList.remove("hidden");
  window.requestAnimationFrame(() => {
    drawAvatar("profileAvatar", traits);
  });
}

export function initTopNav({ mountId = "topNavMount", backHref = "", pageTitle = "ItExists" } = {}) {
  const userId = getStoredValue("itexists_user_id", "dumbassia_user_id");
  if (!userId) {
    window.location.href = "/index.html";
    return { userId: null };
  }

  const mount = document.getElementById(mountId);
  if (!mount) return { userId };
  mount.innerHTML = buildTopNav({ backHref, pageTitle });

  const profileNick = document.getElementById("profileNick");
  const profileName = document.getElementById("profileName");
  const profileBtn = document.getElementById("profileBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const reportModal = document.getElementById("reportModal");

  if (profileNick) {
    profileNick.textContent = getStoredValue("itexists_nickname", "dumbassia_nickname") || "Unnamed Profile";
  }
  if (profileName) {
    profileName.textContent = getStoredValue("itexists_name", "dumbassia_name") || "Saved identity";
  }

  const traits = safeParseTraits(getStoredValue("itexists_traits", "dumbassia_traits", "{}"));
  renderIdentityArt(traits);

  profileBtn?.addEventListener("click", async () => {
    await refreshReport(userId);
    reportModal?.classList.remove("hidden");
  });

  closeModalBtn?.addEventListener("click", () => {
    reportModal?.classList.add("hidden");
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/index.html";
  });

  return { userId };
}
