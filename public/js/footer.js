function buildFooter() {
  const year = new Date().getFullYear();

  return `
    <footer class="site-footer" role="contentinfo" aria-label="Site footer">
      <div class="site-footer-grid">
        <section class="site-footer-section">
          <h2>ItExists</h2>
          <p>
            Built at a hackathon we definitely should not have entered.
            Powered by bad ideas and worse decisions.
          </p>
        </section>

        <section class="site-footer-section">
          <h3>Contact</h3>
          <p>Phone: +91 6969696969</p>
          <p>Email: itexists001@gmail.com</p>
          <p>Office: Bengaluru</p>
        </section>

        <section class="site-footer-section">
          <h3>Instagram</h3>
          <a
            class="site-footer-tag site-footer-link"
            href="https://www.instagram.com/itexi_sts/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @itexi_sts
          </a>
          <p>Posting chaos, creativity, and random brilliance.</p>
          <p>Sometimes funny, sometimes questionable.</p>
          <p>Mostly posted at 3AM with zero regrets.</p>
        </section>

        <section class="site-footer-section">
          <h3>What We Do</h3>
          <p>Email services that may or may not reach.</p>
          <p>Games that make no sense but feel right.</p>
          <p>Memes that hit harder than reality.</p>
          <p>Doodles created during serious meetings.</p>
        </section>
      </div>

      <div class="site-footer-bottom">
        <p>&copy; ${year} ItExists. All rights reserved.</p>
        <p>Made with zero sleep.</p>
        <p>Self-rated 5/5.</p>
      </div>
    </footer>
  `;
}

function mountFooter() {
  const mount = document.getElementById("footerMount");
  if (!mount) return;
  mount.innerHTML = buildFooter();
}

mountFooter();
