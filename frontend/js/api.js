// API Service
const API = {
  baseURL: "http://localhost:5000/api/v1",

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    register: (userData) =>
      API.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),

    login: (credentials) =>
      API.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    getProfile: () => API.request("/auth/profile"),

    updateProfile: (profileData) =>
      API.request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      }),
  },

  // Notes endpoints
  notes: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return API.request(`/notes${queryString ? `?${queryString}` : ""}`);
    },

    getById: (id) => API.request(`/notes/${id}`),

    getByDomain: (domain) => API.request(`/notes/domain/${domain}`),

    download: (id) =>
      API.request(`/notes/${id}/download`, {
        method: "POST",
      }),

    create: (noteData, file) => {
      const formData = new FormData();
      Object.keys(noteData).forEach((key) => {
        formData.append(key, noteData[key]);
      });
      if (file) formData.append("file", file);

      return fetch(`${API.baseURL}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }).then((res) => res.json());
    },

    update: (id, noteData) =>
      API.request(`/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(noteData),
      }),

    delete: (id) =>
      API.request(`/notes/${id}`, {
        method: "DELETE",
      }),
  },

  // Admin endpoints
  admin: {
    login: (credentials) =>
      API.request("/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    getDashboard: () => API.request("/admin/dashboard"),

    getUsers: () => API.request("/admin/users"),

    toggleUserStatus: (userId) =>
      API.request(`/admin/users/${userId}/toggle`, {
        method: "PUT",
      }),
  },
};

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Export API for global use
window.API = API;
