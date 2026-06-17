import { useState } from "react";
import axios from "axios";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";
import { API_BASE } from "../components/vars";
import { api } from "../components/Axios";

export default function SignUp({ onNavigate, onLogin }) {

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
      const response = await axios.post(`${API_BASE}/auth/register`, {
        fullName: form.name,
        email: form.email,
        phone: "+2" + form.phone,
        password: form.password,
      });

      // Adjust based on what your backend actually returns on success
      setMsg({ type: "ok", text: response.data?.message || `Welcome to 3Karati, ${form.name}!` });

      setTimeout(() => onNavigate("signin"), 1000);

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
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const response = await api.post("/auth/google-login", { credential });
      const { token, isSeller, is_seller, role, userId } = response.data;
      if (token) localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", String(userId));
      localStorage.setItem("isSeller", String(isSeller ?? is_seller ?? role === "seller" ?? false));

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
        <InputField label="Password" type="password" name="password" placeholder="Min. 8, max. 72 characters" value={form.password} onChange={handleChange} icon="lock" />
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