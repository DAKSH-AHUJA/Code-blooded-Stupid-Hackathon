import { initTopNav } from "/js/topnav.js";

const { userId } = initTopNav({ mountId: "topNavMount", backHref: "/dashboard.html", pageTitle: "ItExists" });
if (!userId) window.location.href = "/index.html";

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const clearChatBtn = document.getElementById("clearChatBtn");
const historyKey = `itexists_void_history_${userId}`;

let chatHistory = loadHistory();

function loadHistory() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(historyKey) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant"))
      .map((entry) => ({
        role: entry.role,
        content: String(entry.content || "").trim().slice(0, 800)
      }))
      .filter((entry) => entry.content)
      .slice(-8);
  } catch {
    return [];
  }
}

function saveHistory() {
  sessionStorage.setItem(historyKey, JSON.stringify(chatHistory.slice(-8)));
}

function clearHistory() {
  chatHistory = [];
  sessionStorage.removeItem(historyKey);
  renderHistory();
}

function addMessage(text, from) {
  const row = document.createElement("div");
  row.className = `chat-row ${from === "user" ? "chat-row-user" : "chat-row-ai"}`;

  const bubble = document.createElement("div");
  bubble.className =
    from === "user"
      ? "chat-bubble chat-bubble-user"
      : "chat-bubble chat-bubble-ai";
  bubble.textContent = text;

  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderHistory() {
  chatMessages.innerHTML = "";

  if (!chatHistory.length) {
    addMessage("Say something embarrassing and let the damage begin.", "void");
    return;
  }

  chatHistory.forEach((entry) => {
    addMessage(entry.content, entry.role === "user" ? "user" : "void");
  });
}

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = "";
  addMessage(message, "user");
  chatHistory.push({ role: "user", content: message });
  chatHistory = chatHistory.slice(-8);
  saveHistory();

  const loadingRow = document.createElement("div");
  loadingRow.className = "chat-row chat-row-ai";

  const loadingBubble = document.createElement("div");
  loadingBubble.className = "chat-bubble chat-bubble-ai void-loading";
  loadingBubble.textContent = "Preparing your emotional damage...";

  loadingRow.appendChild(loadingBubble);
  chatMessages.appendChild(loadingRow);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const removeLoading = () => loadingRow.remove();

  const ctrl = new AbortController();
  const chatTimeoutMs = 200_000;
  const timeoutId = setTimeout(() => ctrl.abort(), chatTimeoutMs);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        message,
        history: chatHistory.slice(0, -1)
      }),
      signal: ctrl.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Chat currently unavailable.");

    removeLoading();
    addMessage(data.reply, "void");
    chatHistory.push({ role: "assistant", content: data.reply });
    chatHistory = chatHistory.slice(-8);
    saveHistory();

    try {
      await fetch("/api/user/esteem", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: 5 })
      });
    } catch {
      /* esteem is optional; chat reply already shown */
    }
  } catch (error) {
    clearTimeout(timeoutId);
    removeLoading();
    chatHistory = chatHistory.slice(0, -1);
    saveHistory();

    const msg =
      error?.name === "AbortError"
        ? `That took over ${Math.round(chatTimeoutMs / 1000)}s - server or Ollama may be stuck. Check Ollama is running and try a smaller model in .env (OLLAMA_MODEL).`
        : error.message || "Sarcasm is temporarily reloading. Try again in a moment.";
    addMessage(msg, "void");
  }
});

clearChatBtn?.addEventListener("click", () => {
  clearHistory();
});

renderHistory();
