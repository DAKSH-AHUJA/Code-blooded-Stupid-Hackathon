const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../db/connection");
const { askOllama } = require("../lib/ollama");

const router = express.Router();
const nicknamesPath = path.join(__dirname, "..", "lib", "data", "nicknames.txt");
const doodlesDir = path.join(__dirname, "..", "public", "doodles");

function loadNicknamePool() {
  try {
    return fs
      .readFileSync(nicknamesPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function getRandomNickname() {
  const nicknames = loadNicknamePool();
  if (!nicknames.length) return null;
  return nicknames[Math.floor(Math.random() * nicknames.length)];
}

function listDoodles() {
  try {
    return fs
      .readdirSync(doodlesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => ({
        name: entry.name.replace(/\.[^.]+$/, ""),
        file: entry.name,
        url: `/doodles/${encodeURIComponent(entry.name)}`
      }));
  } catch (_error) {
    return [];
  }
}

function fallbackJudge(answers) {
  const nickStarts = ["Captain", "Professor", "Duke", "Agent", "Sir"];
  const nickEnds = ["of Mild Confusion", "the Slightly Damp", "von Oops", "of Lost WiFi", "the Unready"];
  const eyeShapes = ["droopy", "wide", "squinting", "uneven"];
  const mouthShapes = ["frown", "smirk", "open", "confused"];
  const extras = ["sweat_drop", "question_mark", "flies", "halo"];
  const colors = ["#9b9480", "#8f9a88", "#8f8580", "#88939c", "#a0917c"];

  const key = answers.join("|").length;
  return {
    nickname: `${nickStarts[key % nickStarts.length]} ${nickEnds[key % nickEnds.length]}`,
    roast:
      "Your vibe is what happens when a calendar reminder forgets itself. You look emotionally sponsored by buffering icons. Somehow, against all odds, you are still trying and that is both brave and suspicious.",
    avatar_traits: {
      eyeShape: eyeShapes[key % eyeShapes.length],
      mouthShape: mouthShapes[key % mouthShapes.length],
      extraFeature: extras[key % extras.length],
      faceColor: colors[key % colors.length]
    }
  };
}

function sanitizeAvatarTraits(avatarTraits, fallbackTraits) {
  const eyeShapes = new Set(["droopy", "wide", "squinting", "uneven"]);
  const mouthShapes = new Set(["frown", "smirk", "open", "confused"]);
  const extras = new Set(["sweat_drop", "question_mark", "flies", "halo"]);
  const faceColor = typeof avatarTraits?.faceColor === "string" && /^#[0-9a-fA-F]{6}$/.test(avatarTraits.faceColor)
    ? avatarTraits.faceColor
    : fallbackTraits.faceColor;

  return {
    eyeShape: eyeShapes.has(avatarTraits?.eyeShape) ? avatarTraits.eyeShape : fallbackTraits.eyeShape,
    mouthShape: mouthShapes.has(avatarTraits?.mouthShape) ? avatarTraits.mouthShape : fallbackTraits.mouthShape,
    extraFeature: extras.has(avatarTraits?.extraFeature) ? avatarTraits.extraFeature : fallbackTraits.extraFeature,
    faceColor
  };
}

router.post("/create", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name missing. Even that was too hard?" });
    }

    const cleanName = String(name).trim().slice(0, 120);
    const [result] = await pool.execute("INSERT INTO users (name) VALUES (?)", [cleanName]);

    return res.json({
      userId: result.insertId,
      name: cleanName
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, nickname, roast_summary, avatar_traits, self_esteem, roast_count, game_score, created_at
       FROM users
       ORDER BY created_at DESC, id DESC
       LIMIT 12`
    );

    const users = rows.map((user) => {
      if (typeof user.avatar_traits === "string") {
        try {
          user.avatar_traits = JSON.parse(user.avatar_traits);
        } catch (_err) {
          user.avatar_traits = {};
        }
      }
      return user;
    });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

router.post("/judge", async (req, res, next) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ error: "Bad input. Beautifully disappointing." });
    }

    const prompt = `
You are generating a personality judgment profile for a comedy app called ItExists.
Using the answers below, produce ONLY a valid JSON object (no markdown, no code fences, no explanation).

Required JSON shape:
{
  "nickname": "string",
  "roast": "string",
  "avatar_traits": {
    "eyeShape": "droopy|wide|squinting|uneven",
    "mouthShape": "frown|smirk|open|confused",
    "extraFeature": "sweat_drop|question_mark|flies|halo",
    "faceColor": "#RRGGBB muted color"
  }
}

Rules:
- nickname must be unique-feeling, stupid, funny, like "Gerald the Slightly Damp".
- roast is 2-3 sentences, playful and humiliating, not hateful.
- faceColor should be muted and funny.
- Output raw JSON only.

Answers:
1) ${answers[0]}
2) ${answers[1]}
3) ${answers[2]}
`;

    let judged = fallbackJudge(answers);
    try {
      const text = await askOllama(
        "You generate roasty personality profiles and must follow output instructions strictly.",
        prompt,
        {
          temperature: 0.85,
          timeoutMs: 7000
        }
      );
      if (text) {
        const parsed = JSON.parse(text);
        judged = {
          nickname: judged.nickname,
          roast: String(parsed.roast || judged.roast),
          avatar_traits: sanitizeAvatarTraits(parsed.avatar_traits || {}, judged.avatar_traits)
        };
      }
    } catch (_err) {
      // Keep fallback result so quiz flow never hangs on external API.
    }

    const nickname = String(getRandomNickname() || judged.nickname || "Unnamed Disaster");
    const roast = String(judged.roast || "Even the algorithm gave up.");
    const avatarTraits = judged.avatar_traits || {};

    await Promise.all([
      pool.execute(
        "UPDATE users SET nickname = ?, roast_summary = ?, avatar_traits = ? WHERE id = ?",
        [nickname, roast, JSON.stringify(avatarTraits), userId]
      ),
      pool.query(
        "INSERT INTO quiz_answers (user_id, question, answer) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
        [
          userId,
          "If your imagination was a character, what would it be?",
          String(answers[0]),
          userId,
          "What is the mood of your character?",
          String(answers[1]),
          userId,
          "What special power does your character have?",
          String(answers[2])
        ]
      )
    ]);

    return res.json({
      nickname,
      roast,
      avatar_traits: avatarTraits
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/doodles", (req, res) => {
  return res.json(listDoodles());
});

router.patch("/appearance", async (req, res, next) => {
  try {
    const { userId, doodlePath } = req.body;

    if (!userId || !doodlePath || typeof doodlePath !== "string") {
      return res.status(400).json({ error: "Missing appearance data. Beautifully unhelpful." });
    }

    const allowedDoodles = listDoodles();
    const matched = allowedDoodles.find((item) => item.url === doodlePath);
    if (!matched) {
      return res.status(400).json({ error: "Invalid doodle selection. Strong choice, wrong list." });
    }

    const [rows] = await pool.execute("SELECT avatar_traits FROM users WHERE id = ?", [userId]);
    if (!rows.length) {
      return res.status(404).json({ error: "User not found. Even the database moved on." });
    }

    let avatarTraits = {};
    if (typeof rows[0].avatar_traits === "string") {
      try {
        avatarTraits = JSON.parse(rows[0].avatar_traits) || {};
      } catch (_error) {
        avatarTraits = {};
      }
    } else if (rows[0].avatar_traits && typeof rows[0].avatar_traits === "object") {
      avatarTraits = rows[0].avatar_traits;
    }

    const nextTraits = {
      ...avatarTraits,
      doodlePath: matched.url,
      doodleName: matched.name
    };

    await pool.execute("UPDATE users SET avatar_traits = ? WHERE id = ?", [JSON.stringify(nextTraits), userId]);

    return res.json({
      ok: true,
      avatar_traits: nextTraits
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "User not found. Maybe for the best." });
    }

    const user = rows[0];
    if (typeof user.avatar_traits === "string") {
      try {
        user.avatar_traits = JSON.parse(user.avatar_traits);
      } catch (_err) {
        user.avatar_traits = {};
      }
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.patch("/esteem", async (req, res, next) => {
  try {
    const { userId, amount } = req.body;
    const loss = Number(amount || 0);

    if (!userId || Number.isNaN(loss) || loss < 0) {
      return res.status(400).json({ error: "Invalid esteem update. Embarrassing API usage." });
    }

    await pool.execute(
      "UPDATE users SET self_esteem = GREATEST(0, self_esteem - ?) WHERE id = ?",
      [loss, userId]
    );

    const [rows] = await pool.execute("SELECT self_esteem FROM users WHERE id = ?", [userId]);
    return res.json({ self_esteem: rows[0]?.self_esteem ?? 0 });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
