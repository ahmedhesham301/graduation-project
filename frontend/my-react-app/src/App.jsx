import { useState } from "react";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSettings from "./profile";
import "./App.css"; 

export default function App() {
  const [page, setPage] = useState("signin");

  return (
    <div className="app">
      {page === "signin" && <SignIn onNavigate={setPage} />}
      {page === "signup" && <SignUp onNavigate={setPage} />}
      <ProfileSettings />
    </div>
  );
}
