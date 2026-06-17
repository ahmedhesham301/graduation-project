import { useEffect, useRef } from "react";
import "./SocialButtons.css";

export default function SocialButtons({ onSuccess }) {
  const googleBtnRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Check if google script is loaded and client-id is available
    if (window.google && googleBtnRef.current && !initializedRef.current) {
      initializedRef.current = true;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1028711345917-dummyclientid.apps.googleusercontent.com";
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (onSuccess) {
            onSuccess(response.credential);
          }
        }
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 250,
      });
    }
  }, [onSuccess]);

  return (
    <div className="socials" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={googleBtnRef} style={{ minHeight: "40px" }}></div>
    </div>
  );
}



