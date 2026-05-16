// Dynamic Page Title Manager for OtakuVerse with EXACT WEBSITE LOGO MATCH
(function () {
  // === TITLE MANAGEMENT ===
  function getPageName() {
    const path = window.location.pathname;

    // Home page
    if (path === "/" || path === "/index.html") return "Home";

    // Home/Dashboard pages
    if (path.includes("user/home")) return "Dashboard";
    if (path.includes("home.html")) return "Home";

    // Auth pages
    if (path.includes("select-role")) return "Select Role";
    if (path.includes("login") && !path.includes("admin")) return "User Login";
    if (path.includes("register")) return "Create Account";
    if (path.includes("admin-login")) return "Admin Login";

    // Domain pages
    if (path.includes("/cs/")) return "Computer Science";
    if (path.includes("/ds/")) return "Data Science";
    if (path.includes("/it/")) return "Information Technology";

    // Admin pages
    if (path.includes("admin-dashboard")) return "Admin Dashboard";
    if (path.includes("admin")) return "Admin Portal";

    // Domain index pages
    if (path.includes("domain/cs")) return "Computer Science";
    if (path.includes("domain/ds")) return "Data Science";
    if (path.includes("domain/it")) return "Information Technology";

    // Landing/Main pages
    if (path === "/index.html" || path === "/") return "Home";

    // Fallback for any other page
    const fileName = path.split("/").pop().replace(".html", "");
    if (fileName && fileName !== "") {
      return fileName.charAt(0).toUpperCase() + fileName.slice(1);
    }

    return "OtakuVerse";
  }

  function updateTitle() {
    const pageName = getPageName();
    document.title = `OtakuVerse | ${pageName}`;
    console.log(`📌 Title updated: OtakuVerse | ${pageName}`);
  }

  // === EXACT WEBSITE LOGO FAVICON (NO CIRCLE, JUST THE INFINITY SYMBOL) ===
  function createExactLogoFavicon() {
    // Remove existing favicons
    const existingLinks = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"]',
    );
    existingLinks.forEach((link) => link.remove());

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Make background transparent (no circle)
    ctx.clearRect(0, 0, 64, 64);

    // Create purple-pink gradient (exactly matching your website logo)
    const gradient = ctx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(0, "#b84cff"); // Purple
    gradient.addColorStop(1, "#ff6b9d"); // Pink

    // Draw the infinity symbol ONLY - same as website logo
    ctx.fillStyle = gradient;
    ctx.font = '500 52px "Segoe UI", "Font Awesome 6 Free", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("∞", 32, 34);

    // Convert to multiple sizes
    const sizes = [16, 32, 64];
    sizes.forEach((size) => {
      const sizeCanvas = document.createElement("canvas");
      sizeCanvas.width = size;
      sizeCanvas.height = size;
      const sizeCtx = sizeCanvas.getContext("2d");
      sizeCtx.drawImage(canvas, 0, 0, size, size);

      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      link.sizes = `${size}x${size}`;
      link.href = sizeCanvas.toDataURL("image/x-icon");
      document.head.appendChild(link);
    });

    console.log("✅ Exact website logo favicon created (infinity symbol only)");
  }

  // === SVG VERSION - EXACT WEBSITE LOGO ===
  function addExactSvgFavicon() {
    const svgFavicon = document.createElement("link");
    svgFavicon.rel = "icon";
    svgFavicon.type = "image/svg+xml";
    svgFavicon.sizes = "any";
    // Pure infinity symbol with gradient - NO circle, exactly like website logo
    svgFavicon.href =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cdefs%3E%3ClinearGradient id="logoGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23b84cff"/%3E%3Cstop offset="100%25" stop-color="%23ff6b9d"/%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x="50" y="72" font-size="65" text-anchor="middle" fill="url(%23logoGrad)" font-family="Arial, sans-serif" font-weight="bold"%3E∞%3C/text%3E%3C/svg%3E';
    document.head.appendChild(svgFavicon);
  }

  // === APPLE TOUCH ICON (SAME AS WEBSITE LOGO) ===
  function createAppleTouchIcon() {
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");

    // Transparent background
    ctx.clearRect(0, 0, 180, 180);

    // Gradient for infinity symbol
    const gradient = ctx.createLinearGradient(0, 0, 180, 180);
    gradient.addColorStop(0, "#b84cff");
    gradient.addColorStop(1, "#ff6b9d");

    // Draw ONLY the infinity symbol (no background)
    ctx.fillStyle = gradient;
    ctx.font = 'Bold 140px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("∞", 90, 95);

    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
  }

  // === INITIALIZE ===
  updateTitle();
  addExactSvgFavicon(); // SVG version (sharpest, scales perfectly)
  createExactLogoFavicon(); // Canvas fallback
  createAppleTouchIcon(); // For iOS devices

  // Update title on page changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      updateTitle();
    }
  }).observe(document, { subtree: true, childList: true });

  console.log("✅ OtakuVerse Active - Exact website logo as favicon");
})();
