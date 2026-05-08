import { useState, useRef, useEffect } from "react";
import { api } from "../components/Axios";
import { BUCKET_url } from "./vars";
import "./ChatBot.css";

/* ── Icons ── */
const IconClose = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconChat = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IconBot = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-robot" viewBox="0 0 16 16">
  <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/>
  <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/>
</svg>
);
const IconPin = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── Helpers ── */
function formatPrice(p) {
  const n = parseInt(p);
  if (isNaN(n)) return p;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M EGP";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K EGP";
  return n + " EGP";
}

const QUICK_PROMPTS = [
  "Apartments in Cairo",
  "Villas under 2M EGP",
  "3-bedroom homes",
  "New listings",
];

/* ── Property Card ── */
function PropertyCard({ property }) {
  const { id, type, area, rooms, bathrooms, price, city, district, media } = property;
  const imgSrc = media ? `${BUCKET_url}/media/${id}/${media}` : null;

  return (
    <div className="cb-prop-card">
      {imgSrc ? (
        <img
          className="cb-prop-img"
          src={imgSrc}
          alt={type}
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div className="cb-prop-img-ph" style={{ display: imgSrc ? "none" : "flex" }}>
        <IconBot />
      </div>
      <div className="cb-prop-info">
        <div className="cb-prop-price">{formatPrice(price)}</div>
        <div className="cb-prop-row">
          <span className="cb-prop-tag">{type || "property"}</span>
          <span className="cb-prop-meta">{area}m² · {rooms} rooms · {bathrooms} baths</span>
        </div>
        <div className="cb-prop-loc">
          <IconPin /> {district}, {city}
        </div>
      </div>
    </div>
  );
}

/* ── Typing Indicator ── */
function TypingBubble() {
  return (
    <div className="cb-msg-row bot">
      <div className="cb-bot-av"><IconBot /></div>
      <div className="cb-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* ── Message ── */
function Message({ msg }) {
  const { sender, text, type, properties } = msg;

  if (type === "properties") {
    return (
      <div className="cb-msg-row bot cb-props-row">
        <div className="cb-bot-av"><IconBot /></div>
        <div className="cb-prop-list">
          {properties.map((p, i) => <PropertyCard key={p.id ?? i} property={p} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`cb-msg-row ${sender}`}>
      {sender === "bot" && <div className="cb-bot-av"><IconBot /></div>}
      <div className={`cb-bubble ${sender}${type === "error" ? " error" : ""}`}>
        {text}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      type: "text",
      text: "Hello! I'm your 3Karati property assistant. I can help you find homes, apartments, or answer any real estate questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickShown, setQuickShown] = useState(true);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;

    setInput("");
    setQuickShown(false);
    setMessages((prev) => [...prev, { sender: "user", type: "text", text }]);
    setIsLoading(true);

    try {
      const res = await api.post("/chatbot", { message: text });

      // Support multiple response shapes from the backend:
      // 1. Direct array:          res.data = [ {id, price, ...}, ... ]
      // 2. Wrapped array:         res.data.reply / res.data.data / res.data.properties
      // 3. Plain text:            res.data.reply / res.data.message / res.data (string)
      const raw = res.data;

      const isPropertyArray = (val) =>
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] === "object" &&
        (val[0].price !== undefined || val[0].id !== undefined);

      // Resolve the actual payload
      const reply =
        isPropertyArray(raw)         ? raw              // direct array
        : isPropertyArray(raw?.reply)  ? raw.reply        // { reply: [...] }
        : isPropertyArray(raw?.data)   ? raw.data         // { data: [...] }
        : isPropertyArray(raw?.properties) ? raw.properties // { properties: [...] }
        : raw?.reply ?? raw?.message ?? raw?.text ?? raw; // text fallback

      if (isPropertyArray(reply)) {
        setMessages((prev) => [...prev, { sender: "bot", type: "properties", properties: reply }]);
      } else if (typeof reply === "string" && reply.trim()) {
        setMessages((prev) => [...prev, { sender: "bot", type: "text", text: reply }]);
      } else {
        // Last resort: stringify whatever came back so something always shows
        setMessages((prev) => [...prev, { sender: "bot", type: "text", text: JSON.stringify(reply) }]);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          type: "error",
          text: serverMsg || "Could not connect to the server. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="cb-root">
      {/* Chat Window */}
      {isOpen && (
        <div className="cb-window">
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-av"><IconBot /></div>
            <div className="cb-header-info">
              <div className="cb-header-name">3Karati Assistant</div>
              <div className="cb-header-status">
                <span className="cb-status-dot" /> Online · Real estate AI
              </div>
            </div>
            <button className="cb-header-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <IconClose />
            </button>
          </div>

          {/* Messages */}
          <div className="cb-msgs" ref={msgsRef}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {/* Quick prompt buttons */}
            {quickShown && (
              <div className="cb-msg-row bot">
                <div className="cb-bot-av"><IconBot /></div>
                <div className="cb-quick-btns">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      className="cb-qbtn"
                      onClick={() => { setQuickShown(false); sendMessage(p); }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && <TypingBubble />}
          </div>

          {/* Input */}
          <div className="cb-footer">
            <input
              ref={inputRef}
              className="cb-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about properties…"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              className="cb-send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={`cb-fab ${isOpen ? "cb-fab-hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <IconChat />
        <span className="cb-fab-badge" />
      </button>
    </div>
  );
}
