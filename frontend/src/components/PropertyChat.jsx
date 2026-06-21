import { useEffect, useRef, useState } from 'react';
import { api } from './Axios';
import { io } from 'socket.io-client';
import './PropertyChat.css';

export default function PropertyChat({ propertyId, sellerId, currentUser = { id: 0 }, onNavigate, sellerName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const asSeller = currentUser.id === sellerId;
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const isLoggedIn = currentUser.id !== 0;

  // Don't render if seller is viewing their own property
  if (asSeller) return null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(
          `/chat/${propertyId}/${currentUser.id}/${sellerId}`
        );
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
        
        // Record this as a contact event for analytics
        if (currentUser.id !== sellerId) {
          api.post(`/properties/${propertyId}/contact`, { contact_method: 'chat' })
            .catch(err => console.warn('Failed to record chat contact lead:', err));
        }
      } catch (e) {
        console.error('Failed to fetch chat history', e);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [isOpen, propertyId, sellerId, currentUser.id]);

  useEffect(() => {
    if (!isOpen) return;
    let socket;
    try {
      socket = io('http://localhost:8080', {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnectionAttempts: 3,
      });
    } catch (e) {
      console.warn('Socket.io init error', e);
    }
    if (!socket) return;
    socketRef.current = socket;

    socket.emit('register_user', currentUser.id);
    socket.emit('join_chat', {
      senderId: asSeller ? sellerId : currentUser.id,
      receiverId: asSeller ? currentUser.id : sellerId,
      propertyId,
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        if (!Array.isArray(prev)) return [msg];
        // Skip if it's our own message (already added optimistically)
        const myId = asSeller ? sellerId : currentUser.id;
        if (msg.senderId === myId || String(msg.senderId) === String(myId)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, currentUser.id, sellerId, propertyId, asSeller]);

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const optimistic = {
      id: Date.now(),
      senderId: asSeller ? sellerId : currentUser.id,
      receiverId: asSeller ? currentUser.id : sellerId,
      propertyId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => (Array.isArray(prev) ? [...prev, optimistic] : [optimistic]));
    setDraft('');
    socketRef.current?.emit('send_message', {
      senderId: asSeller ? sellerId : currentUser.id,
      receiverId: asSeller ? currentUser.id : sellerId,
      propertyId,
      content: trimmed,
    });
  };

  const myId = asSeller ? sellerId : currentUser.id;

  const handleOpenFullScreen = () => {
    if (onNavigate) {
      onNavigate('profile', { tab: 'chat' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pc-root">
        <button className="pc-contact-btn" onClick={() => onNavigate && onNavigate('signin')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Contact Seller
        </button>
      </div>
    );
  }

  return (
    <div className="pc-root">
      {/* Contact Seller Button */}
      {!isOpen && (
        <button className="pc-contact-btn" onClick={() => setIsOpen(true)}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Contact Seller
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="pc-widget">
          {/* Header */}
          <div className="pc-header">
            <div className="pc-header-left">
              <div className="pc-header-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <div>
                <span className="pc-header-name">{asSeller ? (currentUser.name || 'Buyer') : (sellerName || 'Seller')}</span>
                <button className="pc-header-property" onClick={() => { setIsOpen(false); onNavigate("propertyDetails", { propertyId, id: propertyId, fromPage: "chat" }); }}>
                  View property →
                </button>
              </div>
            </div>
            <div className="pc-header-actions">
              <button className="pc-header-btn" onClick={handleOpenFullScreen} title="Open full chat history">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
              <button className="pc-header-btn" onClick={() => setIsOpen(false)} title="Close chat">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="pc-messages">
            {loading ? (
              <div className="pc-loading">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="pc-empty">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`pc-msg ${String(msg.senderId) === String(myId) ? 'pc-msg-sent' : 'pc-msg-received'}`}
                >
                  <div className="pc-msg-bubble">
                    {msg.content}
                    <span className="pc-msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="pc-input-area">
            <input
              type="text"
              className="pc-input"
              placeholder="Type your message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="pc-send-btn" onClick={send} disabled={!draft.trim()}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
