const config = window.OPERATION_WAKE || {};
const targetDate = new Date(config.departureDate || "2027-01-01T00:00:00-05:00").getTime();

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(el => {
    if (value !== undefined && value !== null) el.textContent = value;
  });
}

function updateCountdown() {
  const daysElement = document.getElementById("days");
  if (!daysElement) return;

  const distance = Math.max(targetDate - Date.now(), 0);
  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance / 3600000) % 24);
  const minutes = Math.floor((distance / 60000) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  daysElement.textContent = days.toLocaleString();
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

function hydrateConfig() {
  setText("[data-config='departure-display']", config.departureDisplay);
  setText("[data-config='departure-short']", config.departureShort);
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
updateCountdown();
if (document.getElementById("days")) setInterval(updateCountdown, 1000);

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
