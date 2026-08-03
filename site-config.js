window.OPERATION_WAKE = {
  currentPhase: "Building the Foundation",
  homePort: "Ocala, Florida",
  destination: "Circumnavigation",
  crew: [
    {
      photo: "assets/crew/joe.jpg",
      name: "Joe",
      title: "Would Be Captain",
      bio: "Army veteran, diesel tech, and licensed realtor. Building the platform, eliminating the debt, and training for the day he takes the helm."
    },
    {
      photo: "assets/crew/natalie.jpg",
      name: "Natalie",
      title: "First Mate",
      bio: "Creative lead, licensed realtor, and the homeschool engine keeping the crew sharp and on course."
    },
    {
      photo: "assets/crew/miriam.jpg",
      name: "Miriam",
      title: "Junior Navigator",
      bio: "Always knows which way is north. Reads the chart, trusts the compass, and asks the best questions."
    },
    {
      photo: "assets/crew/fulton.jpg",
      name: "Fulton",
      title: "Nature & Weather Scout",
      bio: "First to spot a cloud bank, last to come inside. The crew's eyes on the horizon."
    },
    {
      photo: "assets/crew/joan.jpg",
      name: "Joan",
      title: "The Dragon · Chief Moral Officer",
      bio: "Sets the standard. Enforces it loudly. Overalls always ready for whatever comes next."
    }
  ],
  dashboard: {
    website:        100,
    launchPlatform:  70,
    incomeSystems:   35,
    boatPreparation: 20
  }
};

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
        <div class="crew-photo-wrap">
          <img class="crew-photo" src="${member.photo}" alt="${member.name}" loading="lazy" />
        </div>
        <div class="crew-card-body">
          <h3>${member.name}</h3>
          <p class="crew-title">${member.title}</p>
          <p class="crew-bio">${member.bio}</p>
        </div>
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
