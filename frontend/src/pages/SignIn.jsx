import { useState } from "react";
import axios from "axios";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";

const API_BASE = "http://localhost:8080/api"; 

export default function SignIn({ onNavigate, onLogin }) {
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
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: form.email,
        password: form.password,
      });

      
      setMsg({
        type: "ok",
        text: response.data?.message || "Welcome back! You are now signed in.",
      });
      // console.log("onLogin called"); // for test 
      
      // Optional: navigate after successful login
      setTimeout(() => {onLogin();}, 1250);
      //onLogin(); // new update 
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setMsg({
        type: "err",
        text: serverMsg || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <BackButton onClick={() => onNavigate("home")} />
      <div className="card">
        <Logo />
        <h1 className="heading">Welcome <em>back.</em></h1>
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
          <span className="link" onClick={() => onNavigate("signup")}>Sign up</span>
        </p>
      </div>
    </div>
  );
}