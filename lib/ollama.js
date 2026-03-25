const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60_000;

function abortAfter(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

async function postToOllama(path, body, options = {}) {
  async function send(payload) {
    const { signal, cancel } = abortAfter(options.timeoutMs ?? OLLAMA_TIMEOUT_MS);
    try {
      const response = await fetch(`${OLLAMA_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify(payload)
      });
      cancel();

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error ${response.status}: ${text}`);
      }

      return response.json();
    } catch (err) {
      cancel();
      if (err?.name === "AbortError") {
        throw new Error(`Ollama timed out after ${options.timeoutMs ?? OLLAMA_TIMEOUT_MS}ms (is the model pulled and Ollama running?)`);
      }
      throw err;
    }
  }

  try {
    return await send(body);
  } catch (error) {
    const message = String(error?.message || error);
    if (!/cuda error/i.test(message)) {
      throw error;
    }

    const cpuBody = {
      ...body,
      options: {
        ...(body.options || {}),
        num_gpu: 0
      }
    };

    return send(cpuBody);
  }
}

async function askOllama(systemPrompt, userPrompt, options = {}) {
  const data = await postToOllama(
    "/api/generate",
    {
      model: OLLAMA_MODEL,
      system: systemPrompt,
      prompt: userPrompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.8,
        top_p: options.topP ?? 0.9,
        repeat_penalty: options.repeatPenalty ?? 1.1,
        num_predict: options.numPredict ?? 90
      }
    },
    options
  );

  return String(data?.response || "").trim();
}

async function askOllamaChat(messages, options = {}) {
  const data = await postToOllama(
    "/api/chat",
    {
      model: OLLAMA_MODEL,
      stream: false,
      messages,
      options: {
        temperature: options.temperature ?? 0.6,
        top_p: options.topP ?? 0.85,
        repeat_penalty: options.repeatPenalty ?? 1.18,
        num_predict: options.numPredict ?? 70,
        num_ctx: options.numCtx ?? 1024
      }
    },
    options
  );

  return String(data?.message?.content || "").trim();
}

module.exports = { askOllama, askOllamaChat, OLLAMA_MODEL, OLLAMA_URL };
