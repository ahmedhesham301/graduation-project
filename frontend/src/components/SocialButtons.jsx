import { useEffect, useRef } from "react";
import "./SocialButtons.css";

// Global state to avoid multiple initializations of google.accounts.id
let isGoogleAccountsInitialized = false;
let currentOnSuccessHandler = null;

const globalGoogleCallback = (response) => {
  if (currentOnSuccessHandler) {
    currentOnSuccessHandler(response.credential);
  }
};

export default function SocialButtons({ onSuccess }) {
  const googleBtnRef = useRef(null);

  useEffect(() => {
    currentOnSuccessHandler = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    let interval;
    const initGoogle = () => {
      if (window.google && googleBtnRef.current) {
        if (!isGoogleAccountsInitialized) {
          isGoogleAccountsInitialized = true;
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1028711345917-dummyclientid.apps.googleusercontent.com";
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: globalGoogleCallback
          });
        }

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 250,
        });
        return true;
      }
      return false;
    };

    if (!initGoogle()) {
      interval = setInterval(() => {
        if (initGoogle()) {
          clearInterval(interval);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="socials" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={googleBtnRef} style={{ minHeight: "40px" }}></div>
    </div>
  );
}



