import { useState } from "react";
import HomePage from "./pages/HomePage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSettings from "./pages/ProfileSettings";
import FavouriteProperties from "./pages/FavouriteProperties";
import SearchResults from "./pages/SearchResults";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("light");
  const [isLoggedIn, setIsLoggedIn] = useState(()=>{return localStorage.getItem("isLoggedIn") === "true";});
  const [searchFilters, setSearchFilters] = useState({});
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleLogin = () => {
    // console.log("SET LOGIN TRUE"); // for test
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
    setPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    setPage("home");
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    setPage("search");
  };


  return (
    <div className={`app theme-${theme}`}>
      {page === "home" && (
        <HomePage
          onNavigate={setPage}
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onSearch={handleSearch}
        />
      )}

      {page === "signin" && (
        <SignIn onNavigate={setPage} theme={theme} onLogin={handleLogin} />
      )}

      {page === "signup" && <SignUp onNavigate={setPage} theme={theme} />}

      {page === "profile" && (
        <ProfileSettings
          onNavigate={setPage}
          theme={theme}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />
      )}
      {page === "favourite" && (
        <FavouriteProperties
          onNavigate={setPage}
          theme={theme}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />
      )}
      {page === "search" && (
        <SearchResults 
          onNavigate={setPage}
          theme={theme}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          initialFilters={searchFilters}
        />
      )}
      
    </div>
  );
}
