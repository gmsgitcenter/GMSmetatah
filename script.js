(() => {
  const c = window.WEDDING_CONFIG;
  document.querySelectorAll("[data-config]").forEach(el => {
    const key = el.dataset.config;
    if (c[key] !== undefined) el.textContent = c[key];
  });

  const enc = encodeURIComponent;
  const calendarStart = new Date(c.startISO);
  const calendarEnd = new Date(c.endISO);
  const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  document.getElementById("calendarLink").href =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(c.calendarTitle)}&dates=${fmt(calendarStart)}/${fmt(calendarEnd)}&details=${enc(c.calendarDescription)}&location=${enc(c.venue)}`;
  document.getElementById("mapsLink").href =
    `https://www.google.com/maps/search/?api=1&query=${enc(c.venueMapsQuery || c.venue)}`;

  const countdown = () => {
    const diff = calendarStart - Date.now();
    const values = diff > 0 ? [
      Math.floor(diff / 86400000),
      Math.floor(diff / 3600000) % 24,
      Math.floor(diff / 60000) % 60,
      Math.floor(diff / 1000) % 60
    ] : [0,0,0,0];
    ["days","hours","minutes","seconds"].forEach((id,i) => {
      document.getElementById(id).textContent = String(values[i]).padStart(2,"0");
    });
  };
  countdown(); setInterval(countdown, 1000);

  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("formStatus");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!c.appsScriptUrl || c.appsScriptUrl.includes("PASTE_")) {
      status.textContent = "RSVP backend is not configured yet.";
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    status.textContent = "Sending...";
    try {
      await fetch(c.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
        body: new URLSearchParams(data).toString()
      });
      status.textContent = "Thank you — your RSVP has been received.";
      form.reset();
      document.querySelector('input[name="guests"]').value = "1";
      setTimeout(loadWishes, 1200);
    } catch {
      status.textContent = "Something went wrong. Please try again.";
    }
  });

  async function loadWishes() {
    if (!c.appsScriptUrl || c.appsScriptUrl.includes("PASTE_")) {
      document.getElementById("wishesList").innerHTML = '<p class="muted">Connect Google Sheets to display wishes.</p>';
      return;
    }
    try {
      const res = await fetch(c.appsScriptUrl, {cache:"no-store"});
      const items = await res.json();
      const list = document.getElementById("wishesList");
      const publicItems = items.filter(x => x.message && x.name).slice(-30).reverse();
      list.innerHTML = publicItems.length ? publicItems.map(x =>
        `<article class="wish"><b>${escapeHtml(x.name)}</b><p>“${escapeHtml(x.message)}”</p></article>`
      ).join("") : '<p class="muted">Be the first to leave a wish.</p>';
    } catch {
      document.getElementById("wishesList").innerHTML = '<p class="muted">Wishes will appear here shortly.</p>';
    }
  }
  const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  loadWishes();
  setInterval(loadWishes, 15000);

  document.querySelectorAll("[data-copy-config]").forEach(btn => btn.addEventListener("click", async () => {
    const value = c[btn.dataset.copyConfig];
    try { await navigator.clipboard.writeText(value); btn.textContent = "Copied ✓"; setTimeout(()=>btn.textContent="Copy account number",1500); } catch {}
  }));

  const music = document.getElementById("bgMusic");
  const musicButton = document.getElementById("musicButton");
  musicButton.addEventListener("click", async () => {
    if (music.paused) { try { await music.play(); musicButton.classList.add("playing"); } catch {} }
    else { music.pause(); musicButton.classList.remove("playing"); }
  });

  const observer = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("visible")), {threshold:.12});
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
})();
