const express = require("express");
const pool = require("../db/connection");

const router = express.Router();

router.post("/score", async (req, res, next) => {
  try {
    const { userId, score } = req.body;
    const cleanScore = Number(score);
    if (!userId || Number.isNaN(cleanScore) || cleanScore < 0) {
      return res.status(400).json({ error: "Invalid score. You fumbled basic numbers." });
    }

    await pool.execute(
      "UPDATE users SET game_score = GREATEST(game_score, ?) WHERE id = ?",
      [cleanScore, userId]
    );

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/leaderboard", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT name, nickname, game_score FROM users ORDER BY game_score DESC, id ASC LIMIT 10"
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
