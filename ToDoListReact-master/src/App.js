import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import service from "./service";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  // בדיקה אם המשתמש כבר מחובר
  useEffect(() => {
    const user = service.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setUserName(user.userName || user.UserName || "");
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setUserName(user.userName || user.UserName || "");
    navigate("/tasks");
  };

  const handleRegisterSuccess = (user) => {
    setIsAuthenticated(true);
    setUserName(user.userName || user.UserName || "");
    navigate("/tasks");
  };

  const handleLogout = () => {
    service.logout();
    setIsAuthenticated(false);
    setUserName("");
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={
          <Login
            onSuccess={handleLoginSuccess}
            goToRegister={() => navigate("/register")}
          />
        }
      />

      <Route
        path="/register"
        element={
          <Register
            onSuccess={handleRegisterSuccess}
            goToLogin={() => navigate("/login")}
          />
        }
      />

      <Route
        path="/tasks"
        element={
          isAuthenticated ? (
            <TodoPage userName={userName} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// -------- דף המשימות --------
function TodoPage({ userName, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editComplete, setEditComplete] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await service.getTasks();
      setTodos(data);
    } catch (err) {
      console.error("Error loading tasks", err);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await service.addTask(newTask.trim());
      setNewTask("");
      setShowAdd(false);
      await loadTasks();
    } catch (err) {
      console.error("Error adding task", err);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditName(todo.name);
    setEditComplete(!!todo.isComplete);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    try {
      await service.updateTaskFull(editingId, editName.trim(), editComplete);
      setEditingId(null);
      await loadTasks();
    } catch (err) {
      console.error("Error updating task", err);
    }
  }

  async function deleteTask(id) {
    try {
      await service.deleteTask(id);
      await loadTasks();
    } catch (err) {
      console.error("Error deleting task", err);
    }
  }

  const filtered = todos.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-root">
      <div className="card todo-card fade-in">
        <header className="card-header">
          <div className="card-title-block">
            <h1 className="title">שלום, {userName || "משתמש"} 👋</h1>
            <p className="subtitle">לוח המשימות האישי שלך</p>
          </div>
          <button className="btn btn-outline" onClick={onLogout}>
            התנתקות
          </button>
        </header>

        {/* חיפוש */}
        <div className="section">
          <label className="field-label">חיפוש משימה</label>
          <input
            className="text-input"
            type="text"
            placeholder="הקלידי שם משימה לחיפוש..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* הוספת משימה */}
        <div className="section">
          <button
            className="btn btn-primary full-width"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "סגור הוספת משימה ✖" : "➕ הוספת משימה"}
          </button>

          {showAdd && (
            <form className="add-form" onSubmit={handleAddTask}>
              <input
                className="text-input"
                type="text"
                placeholder="שם המשימה החדשה..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-secondary">
                שמירה
              </button>
            </form>
          )}
        </div>

        {/* רשימת משימות */}
        <div className="section">
          <h2 className="section-title">רשימת המשימות</h2>
          {filtered.length === 0 ? (
            <p className="empty-text">אין משימות תואמות כרגע.</p>
          ) : (
            <ul className="task-list">
              {filtered.map((todo) => (
                <li key={todo.id} className="task-row">
                  {editingId === todo.id ? (
                    <div className="edit-box">
                      <input
                        className="text-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={editComplete}
                          onChange={(e) => setEditComplete(e.target.checked)}
                        />
                        משימה הושלמה
                      </label>
                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-secondary small"
                          onClick={saveEdit}
                        >
                          💾 שמירה
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost small"
                          onClick={() => setEditingId(null)}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-main">
                        <span
                          className={
                            "task-name" +
                            (todo.isComplete ? " task-name-complete" : "")
                          }
                        >
                          {todo.name}
                        </span>
                        {todo.isComplete && (
                          <span className="task-chip">✔ הושלמה</span>
                        )}
                      </div>
                      <div className="task-actions">
                        <button
                          className="icon-btn"
                          title="עריכת משימה"
                          onClick={() => startEdit(todo)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn danger"
                          title="מחיקת משימה"
                          onClick={() => deleteTask(todo.id)}
                        >
                          ❌
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
