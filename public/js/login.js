const form = document.getElementById("loginForm");
const input = document.getElementById("nameInput");
const statusText = document.getElementById("statusText");
const savedProfiles = document.getElementById("savedProfiles");
const profilesStatus = document.getElementById("profilesStatus");
const newProfileBtn = document.getElementById("newProfileBtn");
const refreshProfilesBtn = document.getElementById("refreshProfilesBtn");
const createProfilePanel = document.getElementById("createProfilePanel");
const landingToast = document.getElementById("landingToast");

function safeParseTraits(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setActiveProfile(profile) {
  const userId = String(profile.id ?? profile.userId ?? "");
  if (!userId) return;

  const name = String(profile.name || "");
  const nickname = String(profile.nickname || "");
  const traits = JSON.stringify(safeParseTraits(profile.avatar_traits));

  localStorage.setItem("itexists_user_id", userId);
  localStorage.setItem("itexists_name", name);
  localStorage.setItem("itexists_nickname", nickname);
  localStorage.setItem("itexists_traits", traits);

  localStorage.setItem("dumbassia_user_id", userId);
  localStorage.setItem("dumbassia_name", name);
  localStorage.setItem("dumbassia_nickname", nickname);
  localStorage.setItem("dumbassia_traits", traits);
}

function showToast(message) {
  if (!landingToast) return;
  landingToast.textContent = message;
  landingToast.classList.remove("hidden");
  landingToast.classList.add("toast-show");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    landingToast.classList.remove("toast-show");
    window.setTimeout(() => landingToast.classList.add("hidden"), 220);
  }, 1800);
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved earlier";

  const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours <= 1) return "Saved recently";
  if (diffHours < 24) return `Saved ${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `Saved ${diffDays}d ago`;
  return date.toLocaleDateString();
}

function buildProfileCard(profile) {
  const traits = safeParseTraits(profile.avatar_traits);
  const nickname = profile.nickname || "Unfinished Profile";
  const subtitle = profile.nickname ? profile.name : `${profile.name} - quiz not finished`;
  const destination = profile.nickname ? "/dashboard.html" : "/quiz.html";
  const art = traits.doodlePath
    ? `<img src="${traits.doodlePath}" alt="${nickname}" class="saved-profile-art-image" />`
    : `<div class="saved-profile-art-fallback">${nickname.charAt(0).toUpperCase()}</div>`;

  return `
    <article class="profile-card hover-pop" data-user-id="${profile.id}" data-destination="${destination}">
      <div class="profile-card-head">
        <div class="profile-card-main">
          <div class="saved-profile-art">${art}</div>
          <div class="profile-copy">
            <p class="profile-time">${formatRelativeDate(profile.created_at)}</p>
            <h3 class="text-xl font-semibold mt-2">${nickname}</h3>
            <p class="profile-subtitle">${subtitle}</p>
          </div>
        </div>
        <div class="profile-mini-badge">${profile.game_score || 0}</div>
      </div>
      <div class="profile-card-foot">
        <span class="profile-metric">
          Esteem ${Math.max(0, Number(profile.self_esteem || 0))}
        </span>
        <button class="action-button action-button-ghost profile-open-btn" type="button">
          Open Profile
        </button>
      </div>
    </article>
  `;
}

async function loadProfiles() {
  profilesStatus.textContent = "Loading saved profiles...";
  savedProfiles.innerHTML = "";

  try {
    const response = await fetch("/api/user");
    if (!response.ok) throw new Error("Failed to fetch profiles");
    const profiles = await response.json();

    if (!profiles.length) {
      profilesStatus.textContent = "No saved profiles yet. Create one to get started.";
      savedProfiles.innerHTML = '<div class="empty-state">No saved progress yet. Start a profile and it will live here.</div>';
      return;
    }

    profilesStatus.textContent = `${profiles.length} saved profile${profiles.length === 1 ? "" : "s"} ready to reopen.`;
    savedProfiles.innerHTML = profiles.map(buildProfileCard).join("");

    savedProfiles.querySelectorAll(".profile-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.userId);
        const profile = profiles.find((entry) => entry.id === id);
        if (!profile) return;
        setActiveProfile(profile);
        showToast(`Loaded ${profile.nickname || profile.name}`);
        window.setTimeout(() => {
          window.location.href = card.dataset.destination || "/dashboard.html";
        }, 180);
      });
    });
  } catch (_error) {
    profilesStatus.textContent = "Couldn't load saved profiles right now.";
    savedProfiles.innerHTML = '<div class="empty-state">Saved profiles are temporarily unavailable.</div>';
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = input.value.trim();

  if (!name) {
    statusText.textContent = "Type a name first. Even this interface needs some input.";
    statusText.className = "text-sm text-[#ff8f8f]";
    return;
  }

  try {
    statusText.textContent = "Creating profile...";
    statusText.className = "text-sm text-[#f6d66e]";

    const response = await fetch("/api/user/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();

    setActiveProfile({
      id: data.userId,
      name: data.name,
      nickname: "",
      avatar_traits: {}
    });

    showToast("Fresh profile created.");
    window.location.href = "/quiz.html";
  } catch (_error) {
    statusText.textContent = "Couldn't create profile right now. Try again in a moment.";
    statusText.className = "text-sm text-[#ff8f8f]";
  }
});

newProfileBtn?.addEventListener("click", () => {
  createProfilePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  input?.focus();
});

refreshProfilesBtn?.addEventListener("click", () => {
  loadProfiles();
});

loadProfiles();
