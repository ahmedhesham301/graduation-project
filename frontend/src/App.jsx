import { useState, useEffect, useCallback } from "react";
import HomePage from "./pages/HomePage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSettings from "./pages/ProfileSettings";
import FavouriteProperties from "./pages/FavouriteProperties";
import SearchResults from "./pages/SearchResults";
import PropertyDetails from "./pages/PropertyDetails";
import Inbox from "./pages/Inbox";
import AdminDashboard from "./pages/AdminDashboard";
import ChatBot from "./components/ChatBot";
import { api } from "./components/Axios";
import MaintenanceScreen from "./components/MaintenanceScreen";
import "./App.css";

export default function App() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [page, setPage] = useState(
    () => sessionStorage.getItem("page") ?? "home"
  );
  const [previousPage, setPreviousPage] = useState(
    () => sessionStorage.getItem("previousPage") ?? "home"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "light"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("userRole") ?? null
  );
  const [currentUser, setCurrentUser] = useState({ id: 0 });
  const [searchFilters, setSearchFilters] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("searchFilters")) ?? {};
    } catch {
      return {};
    }
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    () => sessionStorage.getItem("selectedPropertyId") ?? null
  );
  const [isSellerView, setIsSellerView] = useState(
    () => sessionStorage.getItem("isSellerView") === "true"
  );

  // Persist theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist navigation state to sessionStorage whenever it changes
  useEffect(() => { sessionStorage.setItem("page", page); }, [page]);
  useEffect(() => { sessionStorage.setItem("previousPage", previousPage); }, [previousPage]);
  useEffect(() => { sessionStorage.setItem("searchFilters", JSON.stringify(searchFilters)); }, [searchFilters]);
  useEffect(() => {
    if (selectedPropertyId) sessionStorage.setItem("selectedPropertyId", selectedPropertyId);
    else sessionStorage.removeItem("selectedPropertyId");
  }, [selectedPropertyId]);
  useEffect(() => {
    sessionStorage.setItem("isSellerView", String(isSellerView));
  }, [isSellerView]);

  // Update document title based on current page
  useEffect(() => {
    const titles = {
      home: "3akarati | Home",
      signin: "Sign In | 3akarati",
      signup: "Sign Up | 3akarati",
      profile: "Profile | 3akarati",
      favourite: "Favorites | 3akarati",
      search: "Search | 3akarati",
      propertyDetails: "Property Details | 3akarati",
      inbox: "Messages | 3akarati",
      admin: "Admin Dashboard | 3akarati",
    };
    document.title = titles[page] || "3akarati";
  }, [page]);

  const [profileTab, setProfileTab] = useState(null);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Fetch current user when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUser({ id: 0 });
      return;
    }
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/user/me");
        setCurrentUser({ id: data.id, name: data.full_name, role: data.role });
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, [isLoggedIn]);

  // Central cleanup — called both by manual logout button and the 401 interceptor
  const clearAuthState = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isSeller");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("page");
    sessionStorage.removeItem("previousPage");
    sessionStorage.removeItem("searchFilters");
    sessionStorage.removeItem("selectedPropertyId");
    sessionStorage.removeItem("isSellerView");
    setIsLoggedIn(false);
    setUserRole(null);
    setPage("home");
  }, []);

  // Listen for 401 events fired by the Axios interceptor
  useEffect(() => {
    window.addEventListener("auth:logout", clearAuthState);
    return () => window.removeEventListener("auth:logout", clearAuthState);
  }, [clearAuthState]);

  // Listen for maintenance mode activation
  useEffect(() => {
    const handleMaintenance = () => {
      setIsMaintenance(true);
    };
    window.addEventListener("system:maintenance", handleMaintenance);
    return () => window.removeEventListener("system:maintenance", handleMaintenance);
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", role);
    if (role === "admin") {
      setPage("admin");
    } else {
      setPage("home");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API error:", err.response?.data?.message ?? err.message);
    } finally {
      // Small timeout to ensure state updates don't collide
      setTimeout(() => {
        clearAuthState();
      }, 100);
    }
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    setPage("search");
  };
const handleNavigate = (target, data = {}) => {
  const protectedPages = ["profile", "favourite"];

  // "chat" is an overlay, not a real page — go home instead
  const resolvedTarget = target === "chat" ? "home" : target;

  if (protectedPages.includes(resolvedTarget) && !isLoggedIn) {
    setPage("signin");
  } else {

    if (resolvedTarget === "propertyDetails") {
      // Set property ID first before switching page
      const propId = data.id ?? data.propertyId ?? null;
      if (propId) setSelectedPropertyId(propId);
      setIsSellerView(!!data.isSeller);

      if (data.fromPage) {
        setPreviousPage(data.fromPage);
      } else {
        setPreviousPage(page);
      }
    }

    setPage(resolvedTarget);

    if (resolvedTarget === "profile" && data.tab) {
      setProfileTab(data.tab);
    } else if (resolvedTarget === "profile") {
      setProfileTab(null);
    }

    // Fallback in case propertyDetails branch wasn't hit
    if (target !== "propertyDetails") {
      if (data.id) setSelectedPropertyId(data.id);
      else if (data.propertyId) setSelectedPropertyId(data.propertyId);
    }
  }
};

  if (isMaintenance) {
    return (
      <div className={`app theme-${theme}`}>
        <MaintenanceScreen onRetrySuccess={() => setIsMaintenance(false)} />
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`}>
      {page === "home" && (
        <HomePage
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSearch={handleSearch}
        />
      )}

      {page === "signin" && (
        <SignIn onNavigate={handleNavigate} theme={theme} onLogin={handleLogin} />
      )}

      {page === "signup" && <SignUp onNavigate={handleNavigate} theme={theme} onLogin={handleLogin} />}

      {page === "profile" && (
        <ProfileSettings
          onNavigate={handleNavigate}
          theme={theme}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
          initialTab={profileTab}
        />
      )}
      {page === "favourite" && (
        <FavouriteProperties
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme} 
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {page === "search" && (
        <SearchResults 
          onNavigate={handleNavigate}
          theme={theme}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
          initialFilters={searchFilters}

        />
      )}
      {page === "propertyDetails" && (
        <PropertyDetails
          propertyId={selectedPropertyId}
          fromPage={previousPage}
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
        />
      )}
    {page === "inbox" && (
        <Inbox currentUser={currentUser} onNavigate={handleNavigate} />
      )}
      {page === "admin" && (
        <AdminDashboard onLogout={handleLogout} onNavigate={handleNavigate} currentUser={currentUser} />
      )}
      {page !== "admin" && <ChatBot onNavigate={handleNavigate} />}
      
    </div>
  );
}