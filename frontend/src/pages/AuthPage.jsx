import { useState } from "react";
import FeedbackMessage from "../components/FeedbackMessage";

function AuthPage({ onLogin, onRegister, loading, feedback }) {
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  function submitLogin(event) {
    event.preventDefault();
    onLogin(loginForm);
  }

  function submitRegister(event) {
    event.preventDefault();
    onRegister(registerForm, () => {
      setTab("login");
      setLoginForm((previous) => ({ ...previous, username: registerForm.username }));
    });
  }

  return (
    <section className="auth-shell">
      <article className="card auth-card">
        <h1>Secure File Vault</h1>
        <p className="muted">Authenticate to upload, protect, and manage your files.</p>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {tab === "login" ? (
          <form className="form-grid" onSubmit={submitLogin}>
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={loginForm.username}
              onChange={(event) =>
                setLoginForm((previous) => ({ ...previous, username: event.target.value }))
              }
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((previous) => ({ ...previous, password: event.target.value }))
              }
              required
            />

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={submitRegister}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              value={registerForm.username}
              onChange={(event) =>
                setRegisterForm((previous) => ({ ...previous, username: event.target.value }))
              }
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm((previous) => ({ ...previous, email: event.target.value }))
              }
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((previous) => ({ ...previous, password: event.target.value }))
              }
              required
            />

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        <FeedbackMessage message={feedback.message} tone={feedback.tone} />
      </article>
    </section>
  );
}

export default AuthPage;
