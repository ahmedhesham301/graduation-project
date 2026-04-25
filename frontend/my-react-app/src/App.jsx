import { useState } from "react";
import HomePage from "./pages/HomePage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSettings from "./pages/ProfileSettings";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <div className={`app theme-${theme}`}>
      {page === "home"    && <HomePage         onNavigate={setPage} theme={theme} toggleTheme={toggleTheme} />}
      {page === "signin"  && <SignIn            onNavigate={setPage} theme={theme} />}
      {page === "signup"  && <SignUp            onNavigate={setPage} theme={theme} />}
      {page === "profile" && <ProfileSettings   onNavigate={setPage} theme={theme} />}
    </div>
  );
}
