import React, { useState } from "react";
import service from "./service";
import "./App.css";

function Register({ onSuccess, goToLogin }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות ❌");
      return;
    }

    try {
      const user = await service.register(userName, password);
      setSuccess("נרשמת בהצלחה! 🎉 מעבירה אותך למשימות...");
      setTimeout(() => {
        onSuccess(user);
      }, 800);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setError("שם המשתמש כבר קיים במערכת ⚠️");
      } else {
        setError("אירעה שגיאה בהרשמה ❌");
      }
    }
  }

  return (
    <div className="page-root">
      <div className="card auth-card fade-in">
        <h1 className="title">Task Manager 云</h1>
        <p className="subtitle">הרשמה למערכת המשימות</p>

        <form onSubmit={handleSubmit} className="form-vertical">
          <label className="field-label">שם משתמש</label>
          <input
            className="text-input"
            type="text"
            placeholder="בחרי שם משתמש..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />

          <label className="field-label">סיסמה</label>
          <input
            className="text-input"
            type="password"
            placeholder="הקלידי סיסמה..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="field-label">אישור סיסמה</label>
          <input
            className="text-input"
            type="password"
            placeholder="הקלידי שוב את הסיסמה..."
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && <div className="msg msg-error">{error}</div>}
          {success && <div className="msg msg-success">{success}</div>}

          <button type="submit" className="btn btn-primary full-width">
            הרשמה
          </button>
        </form>

        <p className="switch-text">
          כבר רשומה?{" "}
          <button className="link-btn" onClick={goToLogin}>
            להתחברות
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
