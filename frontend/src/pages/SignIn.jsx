import { useState } from "react";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";
import { api } from "../components/Axios";

export default function SignIn({ onNavigate, onLogin }) {
  const [googleNeedsPhone, setGoogleNeedsPhone] = useState(false);
  const [googlePhone, setGooglePhone] = useState("");
  const [googleRole, setGoogleRole] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
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
      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const { token, isSeller, is_seller, role, userId } = response.data;
      if (token) localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", String(userId));
      localStorage.setItem("isSeller", String(isSeller ?? is_seller ?? role === "seller" ?? false));

      setMsg({
        type: "ok",
        text: response.data?.message || "Welcome back! You are now signed in.",
      });

      setTimeout(() => { onLogin(role); }, 1250);
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

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const response = await api.post("/auth/google-login", { credential });
      const { token, isSeller, is_seller, role, userId, phone } = response.data;
      if (token) localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", String(userId));
      localStorage.setItem("isSeller", String(isSeller ?? is_seller ?? role === "seller" ?? false));

      if (!phone) {
        setGoogleRole(role);
        setGoogleNeedsPhone(true);
        setLoading(false);
        return;
      }

      setMsg({
        type: "ok",
        text: response.data?.message || "Welcome back! You are now signed in with Google.",
      });

      setTimeout(() => { onLogin(role); }, 1250);
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setMsg({
        type: "err",
        text: serverMsg || "Google authentication failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!googlePhone) {
      setGoogleError("Phone number is required.");
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(googlePhone)) {
      setGoogleError("Please enter a valid Egyptian phone number.");
      return;
    }

    setGoogleLoading(true);
    setGoogleError("");
    try {
      await api.patch("/user/me", { phone: "+20" + googlePhone });
      setMsg({ type: "ok", text: "Profile completed! Signing in..." });
      setTimeout(() => {
        onLogin(googleRole);
      }, 1000);
    } catch (err) {
      console.error(err);
      setGoogleError(err.response?.data?.error || "Failed to update phone number. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (googleNeedsPhone) {
    return (
      <div className="auth-page">
        <BackButton onClick={() => onNavigate("home")} />
        <div className="card">
          <Logo />
          <h1 className="heading" style={{ fontSize: "28px", marginTop: "10px" }}>One Last Step</h1>
          <p className="tagline">Please enter your phone number to complete your Google sign-in.</p>
          
          {googleError && <div className="msg err">{googleError}</div>}
          
          <form onSubmit={handleGooglePhoneSubmit} className="auth-form">
            <InputField
              label="Phone number"
              type="tel"
              name="phone"
              placeholder="01xxxxxxxxx"
              value={googlePhone}
              onChange={(e) => {
                let num = e.target.value.replace(/\D/g, "");
                if (num.length > 11) num = num.slice(0, 11);
                setGooglePhone(num);
                setGoogleError("");
              }}
              icon="phone"
            />
            <button type="submit" className="btn-primary" disabled={googleLoading}>
              {googleLoading ? "Completing sign-in…" : "Complete Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
        <SocialButtons onSuccess={handleGoogleSuccess} />
        <p className="switch-text">
          Don't have an account?{" "}
          <span className="link" onClick={() => onNavigate("signup")}>Sign up</span>
        </p>
      </div>
    </div>
  );
}