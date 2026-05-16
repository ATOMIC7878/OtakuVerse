// Route Guards for Authentication and Authorization

const Guards = {
  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token;
  },

  // Get user role from token
  getUserRole() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role;
    } catch (error) {
      return null;
    }
  },

  // Check if user is admin
  isAdmin() {
    return this.getUserRole() === "admin";
  },

  // Protect route based on requirements
  protectRoute(requiredRole = null) {
    if (!this.isAuthenticated()) {
      window.location.href = "/pages/auth/select-role.html";
      return false;
    }

    if (requiredRole && this.getUserRole() !== requiredRole) {
      window.location.href = "/index.html";
      return false;
    }

    return true;
  },

  // Redirect if already authenticated
  redirectIfAuthenticated(redirectUrl = "/pages/user/home.html") {
    if (this.isAuthenticated()) {
      const role = this.getUserRole();
      if (role === "admin") {
        window.location.href = "/pages/admin/admin-dashboard.html";
      } else {
        window.location.href = redirectUrl;
      }
      return true;
    }
    return false;
  },

  // Check token expiration
  isTokenExpired() {
    const token = localStorage.getItem("token");
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = Date.now() >= payload.exp * 1000;

      if (expired) {
        this.clearSession();
        return true;
      }

      return false;
    } catch (error) {
      return true;
    }
  },

  // Clear user session
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
  },

  // Auto logout on token expiration
  setupAutoLogout() {
    setInterval(() => {
      if (this.isAuthenticated() && this.isTokenExpired()) {
        this.clearSession();
        window.location.href = "/pages/auth/select-role.html";
        window.showNotification(
          "Session expired. Please login again.",
          "warning",
        );
      }
    }, 60000); // Check every minute
  },
};

// Initialize route protection based on current page
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Protect user pages
  if (path.includes("/pages/user/") && !path.includes("/pages/auth/")) {
    Guards.protectRoute("user");
  }

  // Protect admin pages
  if (path.includes("/pages/admin/")) {
    Guards.protectRoute("admin");
  }

  // Setup auto logout
  Guards.setupAutoLogout();
});

// Export guards
window.Guards = Guards;
