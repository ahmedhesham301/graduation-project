import { useState, useEffect } from "react";
import axios from "axios";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";
import { API_BASE } from "../components/vars";
import { api } from "../components/Axios";

export default function SignUp({ onNavigate, onLogin }) {
  const [googleNeedsPhone, setGoogleNeedsPhone] = useState(false);
  const [googlePhone, setGooglePhone] = useState("");
  const [googleRole, setGoogleRole] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingReg, setCheckingReg] = useState(true);
  const [regAllowed, setRegAllowed] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const { data } = await api.get("/health");
        if (data && data.allowRegistrations === false) {
          setRegAllowed(false);
        }
      } catch (err) {
        console.error("Failed to check registration status:", err);
      } finally {
        setCheckingReg(false);
      }
    };
    checkRegistrationStatus();
  }, []);

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
    if (!/[a-z]/.test(form.password)) {
      setMsg({ type: "err", text: "Password must contain at least one lowercase letter." });
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setMsg({ type: "err", text: "Password must contain at least one uppercase letter." });
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setMsg({ type: "err", text: "Password must contain at least one number." });
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(form.password)) {
      setMsg({ type: "err", text: "Password must contain at least one special character." });
      return;
    }

    const phone = form.phone.replace("+20", "");
    if (!/^01[0125][0-9]{8}$/.test(form.phone)) {
      setMsg({
        type: "err",
        text: "Please enter a valid Egyptian phone number.",
      });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const response = await api.post("/auth/register", {
        fullName: form.name,
        email: form.email,
        phone: "+2" + form.phone,
        password: form.password,
      });

      // Adjust based on what your backend actually returns on success
      setMsg({ type: "ok", text: response.data?.message || `Welcome to 3Karati, ${form.name}!` });

      setTimeout(() => onNavigate("signin"), 1000);

    } catch (error) {
      let serverMsg = error.response?.data?.message || error.response?.data?.error;
      
      // If the backend returned detailed Zod validation messages, collect them
      if (error.response?.data?.errors) {
        const details = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => {
            const list = Array.isArray(msgs) ? msgs.join(", ") : msgs;
            return `${field}: ${list}`;
          })
          .join(" | ");
        if (details) serverMsg = details;
      }

      setMsg({
        type: "err",
        text: serverMsg || "Something went wrong. Please try again.",
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
        text: response.data?.message || "Welcome to 3Karati! You are now signed in with Google.",
      });

      if (onLogin) {
        setTimeout(() => { onLogin(role); }, 1250);
      } else {
        setTimeout(() => { onNavigate("signin"); }, 1250);
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setMsg({
        type: "err",
        text: serverMsg || "Google sign-up failed. Please try again.",
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
      setMsg({ type: "ok", text: "Profile completed! Reconnecting..." });
      setTimeout(() => {
        if (onLogin) {
          onLogin(googleRole);
        } else {
          onNavigate("signin");
        }
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
          <p className="tagline">Please enter your phone number to complete your Google registration.</p>
          
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
              {googleLoading ? "Completing registration…" : "Complete Registration"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (checkingReg) {
    return (
      <div className="auth-page">
        <BackButton onClick={() => onNavigate("home")} />
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "280px" }}>
          <p style={{ color: "var(--soft)", fontSize: "14px" }}>Loading details...</p>
        </div>
      </div>
    );
  }

  if (!regAllowed) {
    return (
      <div className="auth-page">
        <BackButton onClick={() => onNavigate("home")} />
        <div className="card">
          <Logo />
          <div className="reg-closed-container">
            <div className="reg-closed-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="heading" style={{ fontSize: "28px", textAlign: "center", margin: "10px 0 4px" }}>Registrations Paused</h1>
            <p className="tagline" style={{ textAlign: "center", marginBottom: "12px", lineHeight: "1.5" }}>
              New signups are temporarily disabled by the administrator. Please check back later.
            </p>
            <button className="btn-primary" onClick={() => onNavigate("signin")} style={{ marginTop: "12px" }}>
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </div>
    );
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
        <InputField label="Phone number"  type="tel"  name="phone"  placeholder="01xxxxxxxxx"  value={form.phone}  onChange={(e) => {
        let numbersOnly = e.target.value.replace(/\D/g, "");
        if (numbersOnly.length > 11) {
        numbersOnly = numbersOnly.slice(0, 11);}
        setForm({...form,phone: numbersOnly,});
        setMsg({ type: "", text: "" });}}
        icon="phone"/>          
        <InputField label="Password" type="password" name="password" placeholder="Min. 8, max. 72 characters" value={form.password} onChange={handleChange} icon="lock" autoComplete="new-password" />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "6px" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <div className="divider"><span>or continue with</span></div>
        <SocialButtons onSuccess={handleGoogleSuccess} />
        <p className="switch-text">
          Already have an account?{" "}
          <span className="link" onClick={() => onNavigate("signin")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}