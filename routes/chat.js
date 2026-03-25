const express = require("express");
const pool = require("../db/connection");
const { askOllamaChat } = require("../lib/ollama");

const router = express.Router();
const CHAT_TIMEOUT_MS = Number(process.env.OLLAMA_CHAT_TIMEOUT_MS) || 45_000;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clampSentenceCount(text, maxSentences = 2) {
  const normalized = String(text || "")
    .replace(/[*_`~]/g, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";

  const parts = normalized.match(/[^.!?]+[.!?]*/g) || [normalized];
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(" ")
    .trim();
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant"))
    .map((entry) => ({
      role: entry.role,
      content: String(entry.content || "").trim().slice(0, 600)
    }))
    .filter((entry) => entry.content)
    .slice(-6);
}

function isSeriousMessage(message) {
  const lower = String(message || "").toLowerCase();
  return lower.includes("serious") || lower.includes("seriously");
}

function soundsSupportive(text) {
  const lower = String(text || "").toLowerCase();
  const bannedPhrases = [
    "i understand",
    "i'm sorry",
    "you've got this",
    "you got this",
    "it's okay",
    "its okay",
    "that sounds hard",
    "your feelings are valid",
    "you are not alone",
    "take a deep breath",
    "try to",
    "you should",
    "it might help",
    "here are",
    "consider",
    "advice",
    "support",
    "hope that helps",
    "have you considered",
    "what exactly do you mean"
  ];

  return bannedPhrases.some((phrase) => lower.includes(phrase));
}

function isTooFlowery(text) {
  const lower = String(text || "").toLowerCase();
  const flowerySignals = [
    "garden",
    "desert of your soul",
    "swarm",
    "existential dread beetles",
    "ancient prophecy",
    "cinematic",
    "imax",
    "blooming"
  ];

  return flowerySignals.some((phrase) => lower.includes(phrase));
}

function extractTopic(message) {
  const lower = String(message || "").toLowerCase();

  const topics = [
    { key: "friend", words: ["friend", "friends", "reply", "texted", "ignoring", "ignore"] },
    { key: "work", words: ["work", "office", "coworker", "boss", "job", "meeting"] },
    { key: "relationship", words: ["relationship", "girlfriend", "boyfriend", "partner", "ex"] },
    { key: "stage", words: ["stage", "speech", "presentation", "audience", "public speaking"] },
    { key: "exam", words: ["exam", "test", "result", "grade", "college"] },
    { key: "interview", words: ["interview", "resume", "hiring"] },
    { key: "late", words: ["late", "deadline", "missed", "delay"] },
    { key: "message", words: ["message", "text", "chat", "dm"] }
  ];

  const match = topics.find((topic) => topic.words.some((word) => lower.includes(word)));
  return match?.key || "generic";
}

function buildSeriousFallback(topic, profile) {
  const nickname = profile.nickname || "Unnamed Disaster";
  const name = profile.name || "mystery intern";

  switch (topic) {
    case "friend":
      return pickRandom([
        [
          `Yeah, great, one dry reply and now your brain is going to spend the night proving your friend is done with you.`,
          `By midnight ${nickname} will sound like the nickname they use when explaining why talking to you became a chore.`
        ],
        [
          `Perfect, now one lukewarm reply is going to turn into a full documentary in your head about why they secretly tolerate you out of pity.`,
          `By tonight you'll be auditing every old chat like there was an early warning system for this.`
        ],
        [
          `Fantastic, now your brain gets to treat one delayed reply like friendship bankruptcy paperwork.`,
          `In three hours you'll be convinced they muted you emotionally weeks ago and you just noticed late.`
        ]
      ]);
    case "work":
      return pickRandom([
        [
          `Fantastic, one flat "okay" at work and now your brain is going to treat every neutral face like proof they regret hiring you.`,
          `By tonight basic office silence will feel like a company-wide review of your personality.`
        ],
        [
          `Amazing, one dry work reply and now your brain thinks HR is already drafting a quiet little summary called "concerns."`,
          `Every normal pause is going to sound personal for the rest of the day.`
        ],
        [
          `Great, now that one neutral message from work is going to follow you around like evidence in a case nobody told you existed.`,
          `By evening you'll be decoding punctuation like your salary depends on commas.`
        ]
      ]);
    case "relationship":
      return pickRandom([
        [
          `Great, now one weird text is going to become relationship autopsy material.`,
          `By bedtime you'll be reading punctuation like it personally filed the breakup papers and cc'd your dignity.`
        ],
        [
          `Excellent, now your brain gets to turn one off vibe into a full romantic crime scene.`,
          `You're about to inspect tone like it left fingerprints on your self-respect.`
        ],
        [
          `One odd message and suddenly your whole relationship has a suspicious background score in your head.`,
          `Sleep well while your brain replays every text like it missed the twist ending.`
        ]
      ]);
    case "stage":
      return pickRandom([
        [
          `Yeah, no shit you're scared. Your brain is basically screaming, "Hey genius, let's stand under bright lights while strangers judge every word that falls out of your mouth."`,
          `Then you'll trip over one line and remember it every time you try to sleep for the next six months.`
        ],
        [
          `Of course you're scared. Your brain is already preloading the exact second your voice does something humiliating in public.`,
          `One awkward pause and you'll store it like a treasured memory of failure.`
        ],
        [
          `Wonderful plan, really, putting your nervous system on stage and hoping it behaves like a professional adult.`,
          `The first cough from the audience is going to feel like a review.`
        ]
      ]);
    case "exam":
      return pickRandom([
        [
          `Excellent, now your brain gets to pretend one exam decides whether you're secretly a fraud with stationery.`,
          `By the time it starts you'll be grading your own breathing pattern like that helps.`
        ],
        [
          `Perfect, now this exam gets to wear a fake mustache and pretend it's your entire future.`,
          `You'll panic so hard over one question you'll forget you speak a language.`
        ],
        [
          `Great, another test for your brain to treat like a public referendum on whether you were ever smart to begin with.`,
          `You're going to revise one topic and somehow feel guilty about all the other ones simultaneously.`
        ]
      ]);
    default:
      return pickRandom([
        [
          `${name}, the second you said serious your brain opened a private investigation into why this one tiny vibe means people are finally tired of you.`,
          `In a few hours you'll be replaying it like it was the exact moment your reputation quietly gave up.`
        ],
        [
          `The second you said serious, your brain took that as legal permission to make this weird little moment define your entire week.`,
          `By tonight you'll be acting like this was the start of a slow social collapse.`
        ],
        [
          `Amazing, now your brain gets to inflate one uncomfortable detail into a personality verdict.`,
          `Later you're going to replay it with extra shame you did not even have at the time.`
        ]
      ]);
  }
}

function buildDirectFallback(topic, profile, message) {
  const nickname = profile.nickname || "Unnamed Disaster";
  const lower = String(message || "").toLowerCase();

  switch (topic) {
    case "interview":
      return pickRandom([
        [
          `Amazing. You lost a fight to your own interview schedule and still told the story like the clock was being unfair to you.`,
          `That is not bad luck, that is project management by emotional improv.`
        ],
        [
          `Forgetting your interview is such a bold way to tell employment you prefer suspense over planning.`,
          `At this point even your calendar deserves an apology.`
        ],
        [
          `Missing your own interview is incredible because the opportunity was literally booked under your name and you still ghosted it.`,
          `That takes a special kind of confidence.`
        ]
      ]);
    case "late":
      return pickRandom([
        [
          `${nickname}, being late again is impressive because clocks announce their attack in advance.`,
          `You keep losing to minutes like they trained specifically for you.`
        ],
        [
          `Being late this often is not a habit anymore, it is branding.`,
          `Time sees you coming and starts laughing first.`
        ],
        [
          `${nickname}, you treat deadlines like decorative suggestions and somehow still act surprised by consequences.`,
          `Even five minutes is starting to take this personally.`
        ]
      ]);
    case "message":
      return pickRandom([
        [
          `That message had the energy of someone walking into a glass door and insisting it was part of the plan.`,
          `${nickname}, your communication style remains both brave and regrettable.`
        ],
        [
          `That text looked like your thumbs were improvising without legal supervision.`,
          `Bold tone, weak survival instinct.`
        ],
        [
          `You sent that message with the confidence of someone who was absolutely not going to reread it afterward and suffer.`,
          `Unfortunate strategy, really.`
        ]
      ]);
    case "friend":
      return pickRandom([
        [
          `You are reading that friendship situation with the confidence of a detective who got their badge from a cereal box.`,
          `Even your assumptions sound slightly out of breath.`
        ],
        [
          `You looked at one social clue and built a whole courtroom drama out of it.`,
          `Your inner narrator needs supervision.`
        ],
        [
          `The way you interpret friendships would get rejected as too dramatic in a low-budget series.`,
          `Still, impressive commitment to the bit.`
        ]
      ]);
    default:
      if (lower.includes("scared") || lower.includes("nervous")) {
        return pickRandom([
          [
            `Yeah, obviously you're nervous. Your confidence looks like it was assembled from leftover parts.`,
            `The wild part is you still keep presenting it like a finished product.`
          ],
          [
            `Of course you're nervous. Your bravado has the structural integrity of wet cardboard.`,
            `Still, points for committing to the illusion.`
          ],
          [
            `You sound nervous in that very specific way people do right before pretending they are actually "excited."`,
            `Nobody buys that, including your own organs.`
          ]
        ]);
      }

      return pickRandom([
        [
          `${nickname}, that was a remarkably efficient way to sound confident and wrong at the same time.`,
          `The hustle is noted, the accuracy is not.`
        ],
        [
          `That had the exact energy of a bad decision introducing itself with a handshake.`,
          `${nickname}, very committed, very unnecessary.`
        ],
        [
          `You really delivered that like confidence and judgment had agreed to stop speaking to each other.`,
          `Honestly, memorable technique.`
        ]
      ]);
  }
}

function buildFallbackReply(message, profile = {}) {
  const topic = extractTopic(message);
  const lines = isSeriousMessage(message)
    ? buildSeriousFallback(topic, profile)
    : buildDirectFallback(topic, profile, message);

  return clampSentenceCount(lines.join(" "), 2);
}

async function getUserProfile(userId) {
  const [rows] = await pool.execute(
    "SELECT id, name, nickname, roast_summary, self_esteem, roast_count FROM users WHERE id = ?",
    [userId]
  );

  return rows[0] || null;
}

function buildSystemPrompt(profile, message) {
  const seriousMode = isSeriousMessage(message);
  const nickname = profile?.nickname || "Unnamed Disaster";
  const name = profile?.name || "mortal";

  return `
You are the insult-comedian voice inside ItExists.
Reply like a sarcastic friend with no conscience and no urge to help.

Hard rules:
- Be specific to the user's exact message.
- Be funny, sharp, humiliating, and conversational.
- Never be supportive, therapeutic, balanced, useful, or reassuring.
- Never ask follow-up questions.
- Never give advice or steps.
- Use 1 or 2 short sentences only.
- One paragraph only.
- No bullet points, no markdown, no filler, no random jokes unrelated to the message.
- Never refer to yourself by any title or name.

Serious mode:
- If the user says "serious" or "seriously", switch into overthinking mode immediately.
- Start with the fear itself, then sharpen it.
- Make them spiral about judgment, awkward memories, hidden meaning, and social consequences.
- Do not use poetic metaphors or decorative nonsense.

Voice:
- Sarcastic, on-point, a little cruel, but still funny.
- The user's nickname is "${nickname}" and name is "${name}". Use them only when it makes the insult hit harder.
`.trim();
}

function buildStyleExamples(message) {
  if (isSeriousMessage(message)) {
    return [
      {
        role: "user",
        content: "seriously i think my friend is ignoring me"
      },
      {
        role: "assistant",
        content:
          "Yeah, great, one dry reply and now your brain is going to spend the night proving your friend is done with you. By midnight you'll be rereading old messages like they contain official notice that your personality expired."
      },
      {
        role: "user",
        content: "serious i'm scared about going on stage"
      },
      {
        role: "assistant",
        content:
          "Yeah, no shit you're scared. Your brain is already planning the exact second you blank, hear one cough in the audience, and decide everybody watched your confidence die in real time."
      }
    ];
  }

  return [
    {
      role: "user",
      content: "i forgot my interview was today"
    },
    {
      role: "assistant",
      content:
        "Amazing. You lost a fight to your own schedule and still told the story like time was being dramatic on purpose."
    },
    {
      role: "user",
      content: "i sent a weird message"
    },
    {
      role: "assistant",
      content:
        "That message had the energy of someone tripping in public and pretending it was choreography. Bold, but not convincing."
    }
  ];
}

function shouldFallback(reply, message) {
  if (!reply) return true;
  if (soundsSupportive(reply)) return true;
  if (isTooFlowery(reply)) return true;
  if (reply.includes("?")) return true;

  const lowerReply = reply.toLowerCase();
  const lowerMessage = String(message || "").toLowerCase();
  const topic = extractTopic(message);

  if (topic !== "generic" && !lowerReply.includes(topic === "message" ? "message" : topic)) {
    const topicWords = {
      friend: ["friend", "reply", "ignore", "message"],
      work: ["work", "office", "boss", "coworker"],
      relationship: ["relationship", "text", "partner", "breakup"],
      stage: ["stage", "audience", "speech", "presentation"],
      exam: ["exam", "test", "grade", "result"],
      interview: ["interview", "schedule", "resume"],
      late: ["late", "time", "clock", "deadline"],
      message: ["message", "text", "reply", "chat"]
    }[topic] || [];

    const overlaps = topicWords.some((word) => lowerReply.includes(word));
    if (!overlaps) return true;
  }

  if (isSeriousMessage(lowerMessage) && !/(tonight|midnight|brain|replay|judg|audience|friend|work|message|blank|spiral)/.test(lowerReply)) {
    return true;
  }

  return false;
}

router.post("/", async (req, res, next) => {
  const userId = req.body?.userId;
  const message = req.body?.message;
  const history = sanitizeHistory(req.body?.history);

  try {
    if (!userId || !message || !String(message).trim()) {
      return res.status(400).json({ error: "No message? Incredible conversational talent." });
    }

    const cleanMessage = String(message).trim().slice(0, 1200);
    const profile = await getUserProfile(userId);

    const messages = [
      { role: "system", content: buildSystemPrompt(profile, cleanMessage) },
      ...buildStyleExamples(cleanMessage),
      ...history,
      { role: "user", content: cleanMessage }
    ];

    const text = await askOllamaChat(messages, {
      temperature: 0.55,
      topP: 0.88,
      repeatPenalty: 1.15,
      numPredict: isSeriousMessage(cleanMessage) ? 64 : 72,
      numCtx: 896,
      timeoutMs: CHAT_TIMEOUT_MS
    });

    const reply = clampSentenceCount(text, 2);
    const finalReply = shouldFallback(reply, cleanMessage)
      ? buildFallbackReply(cleanMessage, profile || {})
      : reply;

    await pool.execute("UPDATE users SET roast_count = roast_count + 1 WHERE id = ?", [userId]);

    return res.json({ reply: finalReply });
  } catch (error) {
    const errMsg = String(error?.message || error);
    if (/timed out|cuda error/i.test(errMsg)) {
      console.warn("Chat route fallback:", errMsg);
    } else {
      console.error("Chat route error:", errMsg);
    }

    let profile = null;
    try {
      profile = await getUserProfile(userId);
    } catch (_innerError) {
      profile = null;
    }

    return res.status(200).json({
      reply: buildFallbackReply(message, profile || {})
    });
  }
});

module.exports = router;
