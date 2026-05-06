import { useState, useEffect, useCallback } from "react";
import HomePage from "./pages/HomePage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSettings from "./pages/ProfileSettings";
import FavouriteProperties from "./pages/FavouriteProperties";
import SearchResults from "./pages/SearchResults";
import { api } from "./components/Axios";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("light");
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [searchFilters, setSearchFilters] = useState({});
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Central cleanup — called both by manual logout button and the 401 interceptor
  const clearAuthState = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isSeller");
    setIsLoggedIn(false);
    setPage("home");
  }, []);

  // Listen for 401 events fired by the Axios interceptor
  useEffect(() => {
    window.addEventListener("auth:logout", clearAuthState);
    return () => window.removeEventListener("auth:logout", clearAuthState);
  }, [clearAuthState]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
    setPage("home");
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Log error but always proceed with local logout
      console.error("Logout API error:", err.response?.data?.message ?? err.message);
    } finally {
      clearAuthState();
    }
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    setPage("search");
  };

  const handleNavigate = (target) => {
    const protectedPages = ["profile", "favourite"];
    if (protectedPages.includes(target) && !isLoggedIn) {
      setPage("signin");
    } else {
      setPage(target);
    }
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