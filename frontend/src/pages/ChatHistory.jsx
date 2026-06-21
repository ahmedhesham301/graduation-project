import { useState, useEffect, useRef } from "react";
import { api } from "../components/Axios";
import { io } from "socket.io-client";
import "./ChatHistory.css";

/* ── Icons ── */
const IconChevronLeft = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChat = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IconProperty = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M3 9l1-5h16l1 5" />
    <path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
    <path d="M5 9v11h14V9" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconTime = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ── Chat Inbox Item ── */
function ChatInboxItem({ chat, onClick }) {
  const { otherUserName, content, timestamp, title } = chat;

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="ch-inbox-item" onClick={() => onClick(chat)}>
      <div className="ch-inbox-avatar">
        <div className="ch-avatar-circle">{otherUserName?.[0]?.toUpperCase() || 'U'}</div>
      </div>
      <div className="ch-inbox-content">
        <div className="ch-inbox-header">
          <div className="ch-inbox-title">{title || 'Property'}</div>
          <div className="ch-inbox-time">{formatTime(timestamp)}</div>
        </div>
        <div className="ch-inbox-meta">
          <div className="ch-inbox-user">
            <IconUser /> {otherUserName}
          </div>
          <div className="ch-inbox-preview">
            {content?.length > 50 ? content.substring(0, 50) + '...' : content}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ChatHistory({ onBack, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch inbox and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inboxRes, userRes] = await Promise.all([
          api.get('/chat/inbox'),
          api.get('/user/me')
        ]);
        setInbox(inboxRes.data.inbox || []);
        setCurrentUserId(String(userRes.data.id));
      } catch (err) {
        console.error('Failed to load inbox:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load messages and connect socket when a chat is selected
  useEffect(() => {
    if (!selectedChat || !currentUserId) return;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chat/${selectedChat.propertyId}/${currentUserId}/${selectedChat.otherUserId}`);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMessages();

    // Connect to Socket.io for real-time messages
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

    socket.emit('register_user', Number(currentUserId));
    socket.emit('join_chat', {
      senderId: Number(currentUserId),
      receiverId: Number(selectedChat.otherUserId),
      propertyId: Number(selectedChat.propertyId),
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        // Skip if it's our own message (already added optimistically)
        if (String(msg.senderId) === currentUserId) return prev;
        return [...prev, msg];
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedChat, currentUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    const trimmed = newMessage.trim();
    setSending(true);

    // Optimistic update
    const optimistic = {
      id: Date.now(),
      senderId: currentUserId,
      receiverId: String(selectedChat.otherUserId),
      propertyId: String(selectedChat.propertyId),
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');

    // Send via socket for real-time delivery to the other user
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        senderId: Number(currentUserId),
        receiverId: Number(selectedChat.otherUserId),
        propertyId: Number(selectedChat.propertyId),
        content: trimmed,
      });
    } else {
      // Fallback to REST if socket not connected
      try {
        await api.post('/chat/messages', {
          propertyId: selectedChat.propertyId,
          receiverId: selectedChat.otherUserId,
          content: trimmed,
        });
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }

    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="ch-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="ch-app">
      {/* Back button */}
      <button className="ch-back-btn" onClick={onBack}>
        <IconChevronLeft /> Back to Profile
      </button>

      <div className="ch-container">
        {/* Inbox View */}
        {!selectedChat && (
          <div className="ch-inbox">
            <div className="ch-header">
              <h2 className="ch-title">My Chats</h2>
              <p className="ch-subtitle">Conversations with sellers and buyers</p>
            </div>

            {inbox.length === 0 ? (
              <div className="ch-empty-state">
                <IconChat />
                <h3>No chats yet</h3>
                <p>Start a conversation with a seller by viewing properties</p>
              </div>
            ) : (
              <div className="ch-inbox-list">
                {inbox.map(chat => (
                  <ChatInboxItem
                    key={`${chat.propertyId}-${chat.otherUserId}`}
                    chat={chat}
                    onClick={setSelectedChat}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat View */}
        {selectedChat && (
          <div className="ch-chat">
            {/* Chat Header */}
            <div className="ch-chat-header">
              <button className="ch-chat-back" onClick={() => { setSelectedChat(null); setMessages([]); }}>
                <IconChevronLeft />
              </button>
              <div className="ch-chat-avatar">
                <div className="ch-avatar-circle">{selectedChat.otherUserName?.[0]?.toUpperCase() || 'U'}</div>
              </div>
              <div className="ch-chat-info">
                <div className="ch-chat-name">{selectedChat.otherUserName}</div>
                <div className="ch-chat-property">
                  <IconProperty /> {selectedChat.title || 'Property'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="ch-messages">
              {messages.length === 0 ? (
                <div className="ch-empty-messages">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`ch-message ${String(msg.senderId) === currentUserId ? 'sent' : 'received'}`}
                  >
                    <div className="ch-message-bubble">
                      {msg.content}
                    </div>
                    <div className="ch-message-time">
                      <IconTime /> {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="ch-input-area">
              <input
                type="text"
                className="ch-message-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <button
                className="ch-send-btn"
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
              >
                <IconSend />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
