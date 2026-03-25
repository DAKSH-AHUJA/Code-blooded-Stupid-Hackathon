require("dotenv").config();

const path = require("path");
const express = require("express");

const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const gameRoutes = require("./routes/game");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/game", gameRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "404: Your dignity was not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server is having a dramatic meltdown. Please try again shortly." });
});

app.listen(PORT, () => {
  console.log(`ItExists server running on http://localhost:${PORT}`);
});
