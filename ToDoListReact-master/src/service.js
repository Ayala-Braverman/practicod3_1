import axios from "axios";

const apiUrl = "http://localhost:5246/api"; // כתובת ה־API שלך

// ✅ יוצרים מופע axios עם הגדרות בסיסיות
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor: מוסיף טוקן אוטומטית לכל בקשה
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Interceptor: במקרה של טוקן לא תקף – התנתקות אוטומטית
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// --------------------------------------------------
// 🧠 פונקציות API
// --------------------------------------------------
const service = {
  // --- Authentication ---
  register: async (username, password) => {
    const res = await api.post("/auth/register", {
      userName: username,
      passwordHash: password,
    });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  login: async (username, password) => {
    const res = await api.post("/auth/login", {
      userName: username,
      passwordHash: password,
    });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // --- Tasks ---
  getTasks: async () => {
    const res = await api.get("/items");
    return res.data;
  },

  getTaskById: async (id) => {
    const res = await api.get(`/items/${id}`);
    return res.data;
  },

  addTask: async (name) => {
    const res = await api.post("/items", { name, isComplete: false });
    return res.data;
  },

  updateTask: async (id, isComplete) => {
    const res = await api.put(`/items/${id}`, { isComplete });
    return res.data;
  },

  updateTaskFull: async (id, name, isComplete) => {
    const res = await api.put(`/items/${id}`, { name, isComplete });
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },
};

export default service;
