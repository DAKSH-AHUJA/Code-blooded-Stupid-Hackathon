import { initTopNav } from "/js/topnav.js";

initTopNav({ mountId: "topNavMount", pageTitle: "ItExists" });

const emailForm = document.getElementById("emailCaptureForm");
const emailInput = document.getElementById("emailInput");
const emailStatus = document.getElementById("emailStatus");
const emailSubmitBtn = document.getElementById("emailSubmitBtn");
const emailModeButtons = Array.from(document.querySelectorAll("[data-email-mode]"));

const EMAIL_SERVICE_FALLBACK_MESSAGE =
  "Email service is not configured yet. Add your EmailJS keys in /public/js/email-config.js first.";

const sillyOpeners = [
  "You really handed over your email like this was going to improve your day.",
  "Bold of you to trust this app with your inbox, but here we are.",
  "This message exists purely because you volunteered your email to chaos."
];

const overthinkLines = [
  "Now your inbox has proof that this decision happened, which feels permanent in a way that should bother you.",
  "At some point later today you are going to reread this and wonder what exact chain of decisions led you here.",
  "The strange part is not that you got this email, it is that a version of you actively asked for it."
];

const closingLines = [
  "Anyway, try not to assign too much meaning to this. You absolutely will.",
  "This was meant to be unserious, which is exactly why it may stick in your head all evening.",
  "You can delete this later, but that does not erase the fact that it happened."
];

let selectedEmailMode = "lighter";

function getStoredValue(primaryKey, legacyKey, fallback = "") {
  return localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey) || fallback;
}

function getTraits() {
  const raw = getStoredValue("itexists_traits", "dumbassia_traits", "{}");
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getEmailConfig() {
  const config = window.ITEXISTS_EMAILJS || {};
  const namedTemplates = config.namedTemplates && typeof config.namedTemplates === "object"
    ? config.namedTemplates
    : {};
  const fallbackTemplateIds = Array.isArray(config.templateIds)
    ? config.templateIds.filter(Boolean)
    : [config.templateId].filter(Boolean);
  const lighterTemplateId = namedTemplates.lighter || fallbackTemplateIds[0] || "";
  const deeperTemplateId = namedTemplates.deeper || fallbackTemplateIds[1] || fallbackTemplateIds[0] || "";

  return {
    publicKey: config.publicKey || "",
    serviceId: config.serviceId || "",
    templateIds: fallbackTemplateIds,
    namedTemplates: {
      lighter: lighterTemplateId,
      deeper: deeperTemplateId
    }
  };
}

function isEmailConfigured() {
  const config = getEmailConfig();
  return Boolean(window.emailjs && config.publicKey && config.serviceId && config.templateIds.length);
}

function setStatus(message, tone = "normal") {
  if (!emailStatus) return;
  emailStatus.textContent = message;
  emailStatus.style.color =
    tone === "error" ? "#ff8f8f" : tone === "success" ? "#f6d66e" : "rgba(247, 242, 234, 0.68)";
}

function buildTemplateParams(userEmail) {
  const name = getStoredValue("itexists_name", "dumbassia_name", "Mysterious Person");
  const nickname = getStoredValue("itexists_nickname", "dumbassia_nickname", "Unfinished Disaster");
  const traits = getTraits();
  const doodleName = traits.doodleName || "mystery doodle";

  const sillyOpener = pickRandom(sillyOpeners);
  const overthinkLine = pickRandom(overthinkLines);
  const closingLine = pickRandom(closingLines);

  return {
    to_email: userEmail,
    to_name: name,
    user_name: name,
    nickname,
    doodle_name: doodleName,
    silly_opener: sillyOpener,
    overthink_line: overthinkLine,
    closing_line: closingLine,
    dashboard_url: `${window.location.origin}/dashboard.html`
  };
}

function setSelectedEmailMode(mode) {
  selectedEmailMode = mode === "deeper" ? "deeper" : "lighter";
  emailModeButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.emailMode === selectedEmailMode);
  });
}

function pickTemplateId(config) {
  if (selectedEmailMode === "deeper" && config.namedTemplates.deeper) {
    return config.namedTemplates.deeper;
  }

  if (selectedEmailMode === "lighter" && config.namedTemplates.lighter) {
    return config.namedTemplates.lighter;
  }

  return pickRandom(config.templateIds);
}

function initEmailService() {
  if (!isEmailConfigured()) {
    setStatus("Add your email if you want, but EmailJS still needs its IDs before this can send.");
    return false;
  }

  const { publicKey } = getEmailConfig();
  window.emailjs.init({ publicKey });
  setStatus("Email damage is ready.");
  return true;
}

emailForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userEmail = String(emailInput?.value || "").trim();
  if (!userEmail) {
    setStatus("Type an email first.", "error");
    return;
  }

  if (!isEmailConfigured()) {
    setStatus(EMAIL_SERVICE_FALLBACK_MESSAGE, "error");
    return;
  }

  const config = getEmailConfig();
  const { serviceId } = config;
  const templateId = pickTemplateId(config);
  const templateParams = buildTemplateParams(userEmail);

  try {
    emailSubmitBtn.disabled = true;
    setStatus("Sending an unnecessary email to your inbox...");

    await window.emailjs.send(serviceId, templateId, templateParams);

    setStatus(`Sent. ${templateParams.overthink_line}`, "success");
    emailForm.reset();
  } catch (_error) {
    setStatus("Email failed to send. Your inbox escaped this round.", "error");
  } finally {
    emailSubmitBtn.disabled = false;
  }
});

emailModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedEmailMode(button.dataset.emailMode);
  });
});

initEmailService();
setSelectedEmailMode("lighter");
