const userId = localStorage.getItem("itexists_user_id") || localStorage.getItem("dumbassia_user_id");
if (!userId) window.location.href = "/index.html";

const questions = [
  {
    text: "If your imagination was a character, what would it be?",
    options: [
      "A chaotic wizard with glitter in their pockets",
      "A sleepy pirate who keeps losing the map",
      "A detective made entirely of cardboard drama",
      "A tiny dragon who hoards bad ideas"
    ]
  },
  {
    text: "What is the mood of your character?",
    options: [
      "Unreasonably confident for no clear reason",
      "Quietly suspicious of everyone in the room",
      "Sad but still somehow theatrical",
      "Pure chaos pretending to be calm"
    ]
  },
  {
    text: "What special power does your character have?",
    options: [
      "Can summon dramatic rain on command",
      "Reads minds but only gets useless gossip",
      "Turns awkward silence into fireworks",
      "Teleports directly into avoidable problems"
    ]
  }
];

const progressFill = document.getElementById("progressFill");
const questionText = document.getElementById("questionText");
const optionsWrap = document.getElementById("optionsWrap");
const quizSection = document.getElementById("quizSection");
const loadingSection = document.getElementById("loadingSection");
const loadingHint = document.getElementById("loadingHint");
const resultSection = document.getElementById("resultSection");
const nicknameText = document.getElementById("nicknameText");
const nicknameLockBtn = document.getElementById("nicknameLockBtn");
const quizToast = document.getElementById("quizToast");
const enterDashboardBtn = document.getElementById("enterDashboardBtn");
const openDoodlePickerBtn = document.getElementById("openDoodlePickerBtn");
const closeDoodleModalBtn = document.getElementById("closeDoodleModalBtn");
const doodleModal = document.getElementById("doodleModal");
const doodleGrid = document.getElementById("doodleGrid");
const selectedDoodlePreview = document.getElementById("selectedDoodlePreview");
const selectedDoodlePlaceholder = document.getElementById("selectedDoodlePlaceholder");
const selectedDoodleName = document.getElementById("selectedDoodleName");

let current = 0;
const answers = [];
let hintTimer = null;
let doodles = [];
let selectedDoodle = null;
let assignedNickname = "";
let latestTraits = {};

const loadingHints = [
  "Sharpening insults and squinting at your choices.",
  "Generating the name you'll be stuck with.",
  "Looking for a doodle slot with your energy.",
  "Locking in your profile damage."
];

function showToast(message) {
  if (!quizToast) return;
  quizToast.textContent = message;
  quizToast.classList.remove("hidden");
  quizToast.classList.add("toast-show");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    quizToast.classList.remove("toast-show");
    window.setTimeout(() => {
      quizToast.classList.add("hidden");
    }, 220);
  }, 1800);
}

function saveProfileState({ nickname, traits }) {
  const traitString = JSON.stringify(traits || {});
  localStorage.setItem("itexists_nickname", nickname);
  localStorage.setItem("itexists_traits", traitString);
  localStorage.setItem("dumbassia_nickname", nickname);
  localStorage.setItem("dumbassia_traits", traitString);
}

function startLoadingHints() {
  let index = 0;
  if (loadingHint) loadingHint.textContent = loadingHints[index];
  window.clearInterval(hintTimer);
  hintTimer = window.setInterval(() => {
    index = (index + 1) % loadingHints.length;
    if (loadingHint) loadingHint.textContent = loadingHints[index];
  }, 1400);
}

function stopLoadingHints() {
  window.clearInterval(hintTimer);
}

async function loadDoodles() {
  if (doodles.length) return doodles;
  const response = await fetch("/api/user/doodles");
  if (!response.ok) throw new Error("Failed to load doodles");
  doodles = await response.json();
  return doodles;
}

function updateSelectedDoodleUI() {
  if (!selectedDoodle) {
    selectedDoodlePreview.classList.add("hidden");
    selectedDoodlePreview.removeAttribute("src");
    selectedDoodlePlaceholder.classList.remove("hidden");
    selectedDoodleName.textContent = "No doodle selected yet";
    return;
  }

  selectedDoodlePreview.src = selectedDoodle.url;
  selectedDoodlePreview.alt = selectedDoodle.name;
  selectedDoodlePreview.classList.remove("hidden");
  selectedDoodlePlaceholder.classList.add("hidden");
  selectedDoodleName.textContent = selectedDoodle.name;
}

function renderDoodleGrid() {
  doodleGrid.innerHTML = "";

  doodles.forEach((doodle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `doodle-option ${selectedDoodle?.url === doodle.url ? "is-selected" : ""}`;
    button.innerHTML = `<img src="${doodle.url}" alt="${doodle.name}" class="doodle-option-image" />`;
    button.addEventListener("click", () => {
      selectedDoodle = doodle;
      latestTraits = {
        ...latestTraits,
        doodlePath: doodle.url,
        doodleName: doodle.name
      };
      updateSelectedDoodleUI();
      renderDoodleGrid();
      doodleModal.classList.add("hidden");
      showToast(`Selected ${doodle.name}`);
    });
    doodleGrid.appendChild(button);
  });
}

async function openDoodleModal() {
  try {
    await loadDoodles();
    renderDoodleGrid();
    doodleModal.classList.remove("hidden");
  } catch (_error) {
    showToast("Couldn't load doodles right now.");
  }
}

function renderQuestion() {
  const q = questions[current];
  questionText.textContent = q.text;
  optionsWrap.innerHTML = "";
  progressFill.style.width = `${(current / questions.length) * 100}%`;

  q.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      showToast(`Locked in: ${option}`);
      answers.push(option);
      current += 1;
      if (current >= questions.length) {
        submitAnswers();
      } else {
        quizSection.classList.remove("fade-in");
        void quizSection.offsetWidth;
        quizSection.classList.add("fade-in");
        renderQuestion();
      }
    });
    optionsWrap.appendChild(btn);
  });
}

async function submitAnswers() {
  quizSection.classList.add("hidden");
  progressFill.style.width = "100%";
  loadingSection.classList.remove("hidden");
  startLoadingHints();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch("/api/user/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, answers }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    stopLoadingHints();
    if (!response.ok) throw new Error("Failed");

    const data = await response.json();
    assignedNickname = data.nickname;
    latestTraits = data.avatar_traits || {};
    saveProfileState({ nickname: assignedNickname, traits: latestTraits });

    loadingSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    resultSection.classList.add("result-reveal");
    nicknameText.textContent = data.nickname;
    showToast("Name assigned. Doodle still pending.");
  } catch (_error) {
    stopLoadingHints();
    loadingSection.innerHTML =
      '<p class="text-[#c0392b]">Judge took too long or exploded. Typical.</p><a class="underline" href="/quiz.html">Retry this humiliation</a>';
  }
}

async function finalizeAppearance() {
  if (!selectedDoodle) {
    showToast("Pick a doodle first.");
    openDoodleModal();
    return;
  }

  try {
    const response = await fetch("/api/user/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, doodlePath: selectedDoodle.url })
    });
    if (!response.ok) throw new Error("Failed to save appearance");
    const data = await response.json();

    latestTraits = data.avatar_traits || latestTraits;
    saveProfileState({ nickname: assignedNickname, traits: latestTraits });
    window.location.assign("/dashboard.html");
  } catch (_error) {
    showToast("Couldn't save your doodle right now.");
  }
}

nicknameLockBtn?.addEventListener("click", () => {
  showToast("Whoops, you can't change this.");
});

openDoodlePickerBtn?.addEventListener("click", () => {
  openDoodleModal();
});

closeDoodleModalBtn?.addEventListener("click", () => {
  doodleModal.classList.add("hidden");
});

doodleModal?.addEventListener("click", (event) => {
  if (event.target === doodleModal) {
    doodleModal.classList.add("hidden");
  }
});

enterDashboardBtn?.addEventListener("click", () => {
  finalizeAppearance();
});

updateSelectedDoodleUI();
renderQuestion();
