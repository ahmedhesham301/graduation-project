import { useState } from "react";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import SocialButtons from "../components/SocialButtons";
import BackButton from "../components/BackButton";
import "./Auth.css";

export default function SignUp({ onNavigate }) {
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg({ type:"", text:"" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) { setMsg({type:"err",text:"Please fill in all fields."}); return; }
    if (form.password.length<6) { setMsg({type:"err",text:"Password must be at least 6 characters."}); return; }
    setLoading(true); setMsg({type:"",text:""});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:150,
          messages:[{ role:"user", content:`Validate signup name "${form.name}" email "${form.email}". If valid email (has @ and dot) respond ONLY with JSON: {"ok":true,"msg":"Account created! Welcome to 3Karati, ${form.name}."} else {"ok":false,"msg":"Invalid email address."}. No markdown.` }],
        }),
      });
      const data = await res.json();
      const result = JSON.parse(data.content?.[0]?.text || "{}");
      setMsg({ type: result.ok?"ok":"err", text: result.msg });
    } catch { setMsg({type:"err",text:"Something went wrong. Please try again."}); }
    finally { setLoading(false); }
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
          <InputField label="Password" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} icon="lock" />
          <button type="submit" className="btn-primary" disabled={loading} style={{marginTop:"6px"}}>{loading?"Creating account…":"Create Account"}</button>
        </form>
        <div className="divider"><span>or continue with</span></div>
        <SocialButtons />
        <p className="switch-text">Already have an account?{" "}<span className="link" onClick={()=>onNavigate("signin")}>Sign in</span></p>
      </div>
    </div>
  );
}
