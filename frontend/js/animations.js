// Anime.js Animations

// Hero Text Animation
function animateHeroText() {
  anime({
    targets: ".hero-title",
    translateY: [50, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: "easeOutCubic",
  });

  anime({
    targets: ".hero-subtitle",
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 1000,
    delay: 300,
    easing: "easeOutCubic",
  });

  anime({
    targets: ".hero-buttons",
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 1000,
    delay: 600,
    easing: "easeOutCubic",
  });
}

// Domain Cards Animation
function animateDomainCards() {
  anime({
    targets: ".domain-card",
    translateY: [50, 0],
    opacity: [0, 1],
    duration: 800,
    delay: anime.stagger(100),
    easing: "easeOutElastic(1, .5)",
  });
}

// Feature Cards Animation
function animateFeatureCards() {
  anime({
    targets: ".feature-card",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 600,
    delay: anime.stagger(100),
    easing: "easeOutBack",
  });
}

// Glow Effect Animation
function animateGlow() {
  anime({
    targets: ".anime-glow",
    keyframes: [
      { textShadow: "0 0 10px rgba(108, 99, 255, 0.5)" },
      { textShadow: "0 0 30px rgba(108, 99, 255, 0.8)" },
      { textShadow: "0 0 10px rgba(108, 99, 255, 0.5)" },
    ],
    duration: 2000,
    loop: true,
    easing: "easeInOutQuad",
  });
}

// Card Hover Animations
document.querySelectorAll(".domain-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    anime({
      targets: card,
      scale: 1.05,
      duration: 300,
      easing: "easeOutCubic",
    });

    anime({
      targets: card.querySelector(".card-icon"),
      rotate: [0, 360],
      duration: 500,
      easing: "easeOutCubic",
    });
  });

  card.addEventListener("mouseleave", () => {
    anime({
      targets: card,
      scale: 1,
      duration: 300,
      easing: "easeOutCubic",
    });
  });
});

// Page Transition Animation
function pageTransition() {
  const tl = anime.timeline({
    easing: "easeOutQuad",
    duration: 750,
  });

  tl.add({
    targets: ".content-wrapper",
    opacity: [0, 1],
    translateY: [20, 0],
  });
}

// Floating Animation for Icons
function initFloatingIcons() {
  anime({
    targets: ".fa-infinity, .fa-code, .fa-chart-line, .fa-network-wired",
    translateY: [-10, 10],
    duration: 2000,
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
  });
}

// Particle Burst on Click
function createParticleBurst(x, y) {
  const particles = [];
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    document.body.appendChild(particle);
    particles.push(particle);

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 200 + 50;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    anime({
      targets: particle,
      translateX: vx,
      translateY: vy,
      opacity: 0,
      duration: 1000,
      easing: "easeOutCubic",
      complete: () => particle.remove(),
    });
  }
}

// Smooth Scroll Animation
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const targetPosition = target.offsetTop;
        anime({
          targets: document.scrollingElement,
          scrollTop: targetPosition,
          duration: 1000,
          easing: "easeInOutQuad",
        });
      }
    });
  });
}

// Initialize all animations when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    animateHeroText();
    animateDomainCards();
    animateFeatureCards();
    animateGlow();
    initFloatingIcons();
    initSmoothScroll();
    pageTransition();
  }, 100);
});

// Animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate-in");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(".domain-card, .feature-card").forEach((el) => {
  observer.observe(el);
});

// Export functions for use in other files
window.Animations = {
  createParticleBurst,
  animateDomainCards,
  animateFeatureCards,
};
