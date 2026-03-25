import { initTopNav } from "/js/topnav.js";

const { userId } = initTopNav({ mountId: "topNavMount", backHref: "/dashboard.html", pageTitle: "ItExists" });
if (!userId) window.location.href = "/index.html";

const memeGrid = document.getElementById("memeGrid");
const memeStatus = document.getElementById("memeStatus");
const refreshMemesBtn = document.getElementById("refreshMemesBtn");

const memeFiles = [
  "WhatsApp Image 2026-03-25 at 15.54.06 (1) - Copy - Copy - Copy - Copy - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06 (1) - Copy - Copy - Copy - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06 (1) - Copy - Copy - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06 (1) - Copy - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06 (1) - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06 (1).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.06.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.07 (1).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.07 (2) - Copy - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.07 (2) - Copy.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.07 (2).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.07.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.08 (1).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.08 (2).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.08.jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.09 (1).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.09 (2).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.10 (1).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.10 (2).jpeg",
  "WhatsApp Image 2026-03-25 at 15.54.10.jpeg"
];

function pickRandomMeme() {
  return memeFiles[Math.floor(Math.random() * memeFiles.length)];
}

function renderMemes() {
  const file = pickRandomMeme();
  memeGrid.innerHTML = `
    <article class="single-meme-card page-pop">
      <img
        class="single-meme-image"
        src="/memes/${encodeURIComponent(file)}"
        alt="Random meme"
        loading="lazy"
      />
    </article>
  `;

  memeStatus.textContent = "One random meme loaded. Refresh for a different one.";
}

refreshMemesBtn?.addEventListener("click", () => {
  renderMemes();
});

renderMemes();
