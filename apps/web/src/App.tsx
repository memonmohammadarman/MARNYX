import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getCurrentUser,
  getHealth,
  login,
  logout,
  register,
  type HealthResponse,
  type User,
} from "./services/api";
import "./App.css";

type Mode = "login" | "register";

function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    Promise.all([
      getHealth().then(setHealth).catch(() => undefined),
      getCurrentUser()
        .then((response) => setUser(response.user))
        .catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response =
        mode === "login"
          ? await login(email, password)
          : await register(email, password, name);

      setUser(response.user);
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      await logout();
      setUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setPassword("");
  }

  if (loading) {
    return (
      <main className="app">
        <section className="loading-card">
          <div className="brand">MARNYX</div>
          <p>Loading your workspace...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">MARNYX</div>
        <div className={`api-status ${health ? "online" : "offline"}`}>
          <span />
          {health ? "API Online" : "API Offline"}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">YOUR DIGITAL WORKSPACE</span>
          <h1>Everything you need, in one place.</h1>
          <p>
            MARNYX brings your account, workspace, and future tools together
            through one secure platform.
          </p>

          {health && (
            <div className="system-card">
              <div>
                <span>Service</span>
                <strong>{health.service}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{health.status}</strong>
              </div>
              <div>
                <span>Version</span>
                <strong>v{health.version}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="auth-card">
          {user ? (
            <div className="authenticated">
              <span className="eyebrow">WELCOME BACK</span>
              <h2>{user.name || "MARNYX User"}</h2>
              <p>{user.email}</p>

              <div className="account-state">
                <span>●</span>
                Authenticated session active
              </div>

              <button className="primary-button" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs">
                <button
                  className={mode === "login" ? "active" : ""}
                  onClick={() => switchMode("login")}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  className={mode === "register" ? "active" : ""}
                  onClick={() => switchMode("register")}
                  type="button"
                >
                  Create account
                </button>
              </div>

              <div className="auth-heading">
                <span className="eyebrow">
                  {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
                </span>
                <h2>
                  {mode === "login"
                    ? "Sign in to MARNYX"
                    : "Create your account"}
                </h2>
                <p>
                  {mode === "login"
                    ? "Continue to your secure workspace."
                    : "Start your secure MARNYX workspace."}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === "register" && (
                  <label>
                    Name
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                )}

                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 12 characters"
                    minLength={mode === "register" ? 12 : 1}
                    maxLength={256}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                  />
                </label>

                {error && <div className="error-box">{error}</div>}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="security-note">
                Your session is protected with an HTTP-only cookie.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
