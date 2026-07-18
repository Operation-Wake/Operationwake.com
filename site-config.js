const config = window.OPERATION_WAKE || {};

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(el => {
    if (value !== undefined && value !== null) el.textContent = value;
  });
}

function hydrateConfig() {
  setText("[data-config='current-phase']", config.currentPhase);
  setText("[data-config='home-port']", config.homePort);
  setText("[data-config='destination']", config.destination);

  const crewGrid = document.querySelector("[data-crew-grid]");
  if (crewGrid && Array.isArray(config.crew)) {
    crewGrid.innerHTML = config.crew.map(member => `
      <article class="crew-card reveal-on-scroll">
        <div class="crew-avatar" aria-hidden="true">${member.initials}</div>
        <h3>${member.name}</h3>
        <p>${member.role}</p>
      </article>
    `).join("");
  }

  Object.entries(config.dashboard || {}).forEach(([key, value]) => {
    const bar = document.querySelector(`[data-progress="${key}"]`);
    const label = document.querySelector(`[data-progress-label="${key}"]`);
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
    if (label) label.textContent = `${value}%`;
  });
}

hydrateConfig();
document.querySelectorAll("#year").forEach(year => {
  year.textContent = new Date().getFullYear();
});

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}

const header = document.querySelector(".site-header");
function updateHeader() {
  if (header) header.classList.toggle("scrolled", window.scrollY > 24);
}
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
});

const revealItems = document.querySelectorAll(".reveal-on-scroll");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}
