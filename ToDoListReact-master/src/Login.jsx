import React, { useState } from "react";
import service from "./service";
import "./App.css";

function Login({ onSuccess, goToRegister }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await service.login(userName, password);
      onSuccess(user);
    } catch (err) {
      console.error(err);
      setError("שם המשתמש או הסיסמה שגויים ❌");
    }
  }

  return (
    <div className="page-root">
      <div className="card auth-card fade-in">
        <h1 className="title">Task Manager 云</h1>
        <p className="subtitle">התחברות למערכת המשימות</p>

        <form onSubmit={handleSubmit} className="form-vertical">
          <label className="field-label">שם משתמש</label>
          <input
            className="text-input"
            type="text"
            placeholder="הקלידי שם משתמש..."
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

          {error && <div className="msg msg-error">{error}</div>}

          <button type="submit" className="btn btn-primary full-width">
            התחברות
          </button>
        </form>

        <p className="switch-text">
          אין לך משתמש?{" "}
          <button className="link-btn" onClick={goToRegister}>
            להרשמה
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
