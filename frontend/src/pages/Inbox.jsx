import { useEffect, useState } from "react";
import { api } from "../components/Axios";
import PropertyChat from "../components/PropertyChat";

// Simple split‑pane inbox page
export default function Inbox({ currentUser, onNavigate }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch inbox data once when component mounts
  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/chat/inbox");
        // API returns { inbox: [...] } per backend implementation
        setConversations(data?.inbox ?? []);
      } catch (err) {
        console.error("Failed to load inbox", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  // Render left sidebar list
  const renderList = () => (
    <div style={{ width: "30%", borderRight: "1px solid #ddd", overflowY: "auto" }}>
      <h3 style={{ padding: "0.5rem" }}>Inbox</h3>
      {loading && <p style={{ padding: "0.5rem" }}>Loading...</p>}
      {!loading && conversations.length === 0 && (
        <p style={{ padding: "0.5rem" }}>No conversations yet.</p>
      )}
      {conversations.map((c) => (
        <div
          key={`${c.property_id}-${c.otherUserId}`}
          onClick={() => setSelected(c)}
          style={{
            display: "flex",
            padding: "0.5rem",
            cursor: "pointer",
            background: selected && selected.property_id === c.property_id && selected.otherUserId === c.otherUserId ? "#f0f0f0" : "transparent",
          }}
        >
          {/* Thumbnail */}
          {c.thumbnail && (
            <img
              src={c.thumbnail}
              alt="thumb"
              style={{ width: 48, height: 48, objectFit: "cover", marginRight: 8, borderRadius: 4 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold" }}>{c.title}</div>
            <div style={{ fontSize: "0.85rem", color: "#555" }}>{c.otherUserName}</div>
            <div style={{ fontSize: "0.75rem", color: "#777", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Right pane – active chat
  const renderChat = () => {
    if (!selected) {
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
          Select a conversation to view messages
        </div>
      );
    }
    // selected contains sellerId and other participant info
    return (
      <div style={{ flex: 1, padding: "1rem" }}>
        <PropertyChat
          propertyId={selected.property_id}
          sellerId={selected.sellerId}
          currentUser={currentUser}
        />
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {renderList()}
      {renderChat()}
    </div>
  );
}
