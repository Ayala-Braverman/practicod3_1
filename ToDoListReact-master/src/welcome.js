import React from "react";
import "./App.css";

function Welcome({ onLogout }) {
  const userName = localStorage.getItem("userName");

  return (
    <div className="todo-container fade-in">
      <header className="todo-header">
        <h1>✨ ברוך הבא, {userName}! ✨</h1>
        <button className="logout-btn" onClick={onLogout}>
          התנתק 🚪
        </button>
      </header>

      <div className="welcome-content">
        <p>זהו לוח המשימות שלך — מוכן להתחיל יום חדש 💪</p>
        <a href="/app" className="btn login-btn">
          מעבר למשימות 📝
        </a>
      </div>
    </div>
  );
}

export default Welcome;
