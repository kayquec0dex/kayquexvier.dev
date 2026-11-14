function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required portfolio element: ${selector}`);
  }
  return element;
}

const themeToggle = requireElement<HTMLButtonElement>("[data-theme-toggle]");
const fontToggle = requireElement<HTMLButtonElement>("[data-font-toggle]");
const themeLabel = requireElement<HTMLElement>("[data-theme-label]");
const fontLabel = requireElement<HTMLElement>("[data-font-label]");
const motionToggle = requireElement<HTMLButtonElement>("[data-motion-toggle]");
const motionLabel = requireElement<HTMLElement>("[data-motion-label]");

themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-theme");
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeLabel.textContent = isLight ? "Tema escuro" : "Tema claro";
});

fontToggle.addEventListener("click", () => {
  const isMono = document.body.classList.toggle("mono-font");
  fontToggle.setAttribute("aria-pressed", String(isMono));
  fontLabel.textContent = isMono ? "Fonte padrão" : "Fonte mono";
});

requireElement<HTMLElement>("[data-year]").textContent = String(new Date().getFullYear());

const hero = requireElement<HTMLElement>(".hero");
const heroArt = requireElement<HTMLElement>(".hero-art");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionReduced = motionPreference.matches;
let motionPreferenceOverridden = false;

function setMotionReduced(reduced: boolean): void {
  motionReduced = reduced;
  document.documentElement.classList.toggle("motion-reduced", reduced);
  const heroProgress = !reduced && hero.offsetHeight > 0
    ? Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1)
    : 0;
  document.documentElement.style.setProperty("--hero-scroll-progress", String(heroProgress));
  motionToggle.setAttribute("aria-pressed", String(!reduced));
  motionToggle.setAttribute("aria-label", reduced ? "Ativar animações" : "Reduzir animações");
  motionLabel.textContent = reduced ? "Ativar efeitos" : "Reduzir efeitos";

  if (!reduced) return;

  hero.style.setProperty("--cursor-x", "0px");
  hero.style.setProperty("--cursor-y", "0px");
  heroArt.classList.remove("is-active");
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    const surface = card.querySelector<HTMLElement>(".project-link");
    if (!surface) {
      throw new Error("A tilt card is missing its .project-link surface.");
    }

    card.classList.remove("is-tilting");
    surface.style.setProperty("--tilt-x", "0deg");
    surface.style.setProperty("--tilt-y", "0deg");
  });
}

setMotionReduced(motionReduced);
motionToggle.addEventListener("click", () => {
  motionPreferenceOverridden = true;
  setMotionReduced(!motionReduced);
});
motionPreference.addEventListener("change", (event) => {
  if (!motionPreferenceOverridden) setMotionReduced(event.matches);
});

let scrollUpdatePending = false;

function updateHeroScrollEffect(): void {
  const heroProgress = !motionReduced && hero.offsetHeight > 0
    ? Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1)
    : 0;
  document.documentElement.style.setProperty("--hero-scroll-progress", String(heroProgress));
}

function scheduleHeroScrollEffect(): void {
  if (scrollUpdatePending) return;
  scrollUpdatePending = true;
  window.requestAnimationFrame(() => {
    scrollUpdatePending = false;
    updateHeroScrollEffect();
  });
}

window.addEventListener("scroll", scheduleHeroScrollEffect, { passive: true });
window.addEventListener("resize", scheduleHeroScrollEffect);
updateHeroScrollEffect();

const revealTargets = document.querySelectorAll<HTMLElement>("[data-reveal]");
const scrollSections = document.querySelectorAll<HTMLElement>("[data-scroll-section]");
const navLinks = document.querySelectorAll<HTMLAnchorElement>(".site-nav .nav-link");

document.documentElement.classList.add("has-reveal");

function updateScrollState(): void {
  const revealBoundary = window.innerHeight * 0.86;
  revealTargets.forEach((element) => {
    if (element.classList.contains("is-visible")) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < revealBoundary && bounds.bottom > 0) {
      element.classList.add("is-visible");
    }
  });

  const activeSection = [...scrollSections].find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= window.innerHeight * 0.5 && bounds.bottom > window.innerHeight * 0.5;
  });
  if (!activeSection) return;

  navLinks.forEach((link) => {
    link.classList.toggle("is-current", link.getAttribute("href") === `#${activeSection.id}`);
  });
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
document.addEventListener("visibilitychange", updateScrollState);
updateScrollState();

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event: PointerEvent) => {
    if (motionReduced) return;
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.style.setProperty("--cursor-x", `${Math.round(x * 14)}px`);
    hero.style.setProperty("--cursor-y", `${Math.round(y * 14)}px`);

    const artBounds = heroArt.getBoundingClientRect();
    heroArt.style.setProperty("--glow-x", `${event.clientX - artBounds.left}px`);
    heroArt.style.setProperty("--glow-y", `${event.clientY - artBounds.top}px`);
    heroArt.classList.add("is-active");
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--cursor-x", "0px");
    hero.style.setProperty("--cursor-y", "0px");
    heroArt.classList.remove("is-active");
  });

  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
    const surface = card.querySelector<HTMLElement>(".project-link");
    if (!surface) {
      throw new Error("A tilt card is missing its .project-link surface.");
    }

    card.addEventListener("pointermove", (event: PointerEvent) => {
      if (motionReduced) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      surface.style.setProperty("--tilt-x", `${(-y * 3).toFixed(2)}deg`);
      surface.style.setProperty("--tilt-y", `${(x * 3).toFixed(2)}deg`);
      card.classList.add("is-tilting");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
    });
  });
}
