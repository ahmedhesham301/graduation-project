import { useState } from "react";
import axios from "axios";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";

// Base URL — change this to your actual backend URL
const API_BASE = "http://localhost:8080/api";

export default function SignUp({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!form.name || !form.email || !form.phone || !form.password) {
      setMsg({ type: "err", text: "Please fill in all fields." });
      return;
    }
    if (form.password.length < 8 || form.password.length > 72) {
      setMsg({ type: "err", text: "Password must be between 8 and 72 characters." });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      // Adjust based on what your backend actually returns on success
      setMsg({ type: "ok", text: response.data?.message || `Welcome to 3Karati, ${form.name}!` });

      // Optional: navigate to sign-in after a short delay
      // setTimeout(() => onNavigate("signin"), 1500);

    } catch (error) {
      // axios puts the response body in error.response.data
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setMsg({
        type: "err",
        text: serverMsg || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <BackButton onClick={() => onNavigate("home")} />
      <div className="card">
        <Logo />
        <h1 className="heading">Find your <em>dream home.</em></h1>
        <p className="tagline">Create a free account and start exploring.</p>
        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <InputField label="Full name" type="text" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} icon="user" />
          <InputField label="Email address" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon="email" />
          <InputField label="Phone number" type="tel" name="phone" placeholder="+20xxxxxxxxxx" value={form.phone} onChange={handleChange} icon="phone" />
          <InputField label="Password" type="password" name="password" placeholder="Min. 8, max. 72 characters" value={form.password} onChange={handleChange} icon="lock" />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "6px" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <div className="divider"><span>or continue with</span></div>
        <SocialButtons />
        <p className="switch-text">
          Already have an account?{" "}
          <span className="link" onClick={() => onNavigate("signin")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}