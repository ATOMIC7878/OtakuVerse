// Global Application State
const App = {
  user: null,
  token: localStorage.getItem("token"),
  currentPage: window.location.pathname,
  config: {
    apiUrl: "http://localhost:5000/api/v1",
    version: "1.0.0",
  },
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("OtakuVerse Initialized");

  // Load components
  await loadComponents();

  // Initialize animations
  initThreeJS();
  initParticleSystem();

  // Check authentication
  await checkAuth();

  // Setup event listeners
  setupEventListeners();

  // Remove loader
  removeLoader();
});

// Load Components
async function loadComponents() {
  const components = ["navbar", "footer", "modals"];

  for (const component of components) {
    try {
      const response = await fetch(`../components/${component}.html`);
      const html = await response.text();
      const container = document.getElementById(`${component}-container`);
      if (container) {
        container.innerHTML = html;
      }
    } catch (error) {
      console.error(`Failed to load ${component}:`, error);
    }
  }
}

// Initialize Three.js Background
function initThreeJS() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Create particle system
  const geometry = new THREE.BufferGeometry();
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x6c63ff,
    size: 0.5,
    transparent: true,
    opacity: 0.5,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  camera.position.z = 500;

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0003;
    renderer.render(scene, camera);
  }

  animate();

  // Handle resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Particle System for mouse interaction
function initParticleSystem() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle(x, y) {
    return {
      x: x,
      y: y,
      size: Math.random() * 5 + 2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      life: 1,
      color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
    };
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter((p) => p.life > 0);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= 0.02;
      p.size *= 0.99;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    requestAnimationFrame(animateParticles);
  }

  document.addEventListener("mousemove", (e) => {
    for (let i = 0; i < 3; i++) {
      particles.push(createParticle(e.clientX, e.clientY));
    }
  });

  window.addEventListener("resize", resize);
  resize();
  animateParticles();
}

// Authentication Check
async function checkAuth() {
  const protectedPages = ["/pages/user/", "/pages/admin/"];
  const isProtected = protectedPages.some((page) =>
    window.location.pathname.includes(page),
  );

  if (isProtected && !App.token) {
    window.location.href = "/pages/auth/select-role.html";
    return;
  }

  if (App.token) {
    try {
      const response = await fetch(`${App.config.apiUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${App.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        App.user = data.data;
        updateUIForUser();
      } else {
        logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  }
}

// Logout Function
function logout() {
  localStorage.removeItem("token");
  App.token = null;
  App.user = null;
  window.location.href = "/index.html";
}

// Update UI Based on User
function updateUIForUser() {
  const userMenu = document.querySelector(".user-menu");
  if (userMenu && App.user) {
    userMenu.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i> ${App.user.email}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </div>
        `;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Add fade-in class to main content
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.classList.add("page-transition");
  }
}

// Remove Loader
function removeLoader() {
  const loader = document.querySelector(".loader-wrapper");
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }, 500);
  }
}

// Global Helper Functions
window.showNotification = function (message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type} notification-slide`;
  notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
        <span>${message}</span>
    `;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#05df8b" : "#ff4757"};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        cursor: pointer;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);

  notification.onclick = () => notification.remove();
};

window.logout = logout;
