import { useState } from "react";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";

export default function SignIn({ onNavigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setMsg({ type: "err", text: "Please fill in all fields." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 150,
          messages: [
            {
              role: "user",
              content: `Validate login email "${form.email}". If valid (has @ and dot) respond ONLY with JSON: {"ok":true,"msg":"Welcome back! You are now signed in."} else {"ok":false,"msg":"Invalid credentials. Please try again."}. No markdown.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const result = JSON.parse(data.content?.[0]?.text || "{}");
      setMsg({ type: result.ok ? "ok" : "err", text: result.msg });
    } catch {
      setMsg({ type: "err", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <BackButton />
      <div className="card">
        <Logo />

        <h1 className="heading">
          Welcome <em>back.</em>
        </h1>
        <p className="tagline">Sign in to continue where you left off.</p>

        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <InputField
            label="Email address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            icon="email"
          />
          <InputField
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            icon="lock"
          />

          <span className="forgot">Forgot password?</span>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="divider"><span>or continue with</span></div>

        <SocialButtons />

        <p className="switch-text">
          Don't have an account?{" "}
          <span className="link" onClick={() => onNavigate("signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
