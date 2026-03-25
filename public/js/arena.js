import { initTopNav } from "/js/topnav.js";

const { userId } = initTopNav({ mountId: "topNavMount", backHref: "/dashboard.html", pageTitle: "ItExists" });
if (!userId) window.location.href = "/index.html";

const board = document.getElementById("board");
const statusText = document.getElementById("status");
const resetGameBtn = document.getElementById("resetGameBtn");
const chaosMessage = document.getElementById("chaosMessage");
const xMoveCount = document.getElementById("xMoveCount");
const oMoveCount = document.getElementById("oMoveCount");

let currentPlayer = "X";
let winner = null;
let cells = [];
let moves = { X: [], O: [] };

const winningSets = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const moveMessages = {
  X: [
    "Player X is pretending this is strategy.",
    "That move had confidence. Not quality, but confidence.",
    "You placed that like chaos had a deadline."
  ],
  O: [
    "Player O responded like vengeance in a neat little square.",
    "That counter-move looked suspiciously personal.",
    "O is making this feel weirdly competitive."
  ]
};

function updateSidebar(message = "") {
  statusText.textContent = winner ? winner : `Player ${currentPlayer} Turn`;
  xMoveCount.textContent = `${moves.X.length} / 2`;
  oMoveCount.textContent = `${moves.O.length} / 2`;
  if (message) chaosMessage.textContent = message;
}

function buildBoard() {
  board.innerHTML = "";
  cells = [];

  for (let i = 0; i < 9; i += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "chaos-cell";
    cell.dataset.index = String(i);
    cell.addEventListener("click", () => handleClick(i));
    board.appendChild(cell);
    cells.push(cell);
  }
}

function renderCells(highlight = []) {
  cells.forEach((cell, index) => {
    const value = moves.X.includes(index) ? "X" : moves.O.includes(index) ? "O" : "";
    cell.textContent = value;
    cell.classList.toggle("filled-x", value === "X");
    cell.classList.toggle("filled-o", value === "O");
    cell.classList.toggle("winning-cell", highlight.includes(index));
  });
}

function findWinner() {
  for (const set of winningSets) {
    const values = set.map((index) => (moves.X.includes(index) ? "X" : moves.O.includes(index) ? "O" : ""));
    if (values.every((value) => value === "X")) return { player: "X", cells: set };
    if (values.every((value) => value === "O")) return { player: "O", cells: set };
  }
  return null;
}

function handleClick(index) {
  if (winner) return;
  if (moves.X.includes(index) || moves.O.includes(index)) return;

  if (moves[currentPlayer].length === 2) {
    const removedIndex = moves[currentPlayer].shift();
    cells[removedIndex].classList.add("ghost-pop");
    window.setTimeout(() => cells[removedIndex].classList.remove("ghost-pop"), 240);
  }

  moves[currentPlayer].push(index);
  renderCells();

  const result = findWinner();
  if (result) {
    winner = `Player ${result.player} Wins`;
    renderCells(result.cells);
    updateSidebar(`Player ${result.player} accidentally looked competent.`);
    return;
  }

  const messageList = moveMessages[currentPlayer];
  const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateSidebar(randomMessage);
}

function resetGame() {
  currentPlayer = "X";
  winner = null;
  moves = { X: [], O: [] };
  renderCells();
  updateSidebar("Fresh board. New mistakes.");
}

resetGameBtn?.addEventListener("click", resetGame);

buildBoard();
resetGame();
