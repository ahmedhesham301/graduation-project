import "./InputField.css";

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const icons = { email: EmailIcon, lock: LockIcon, user: UserIcon };

export default function InputField({ label, type, name, placeholder, value, onChange, icon }) {
  const Icon = icons[icon] || EmailIcon;
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="input-wrap">
        <span className="input-ico"><Icon /></span>
        <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
          autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : "name"} />
      </div>
    </div>
  );
}
