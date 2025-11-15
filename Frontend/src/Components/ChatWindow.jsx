import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createSocket, decodeUserIdFromToken } from "../lib/socket";
import { Send } from "lucide-react";
import "./styles/ChatWindow.css";

export default function ChatWindow({ peerId, peerName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const socketRef = useRef(null);

  // Current logged-in user
  const me = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.id || payload._id;
    } catch {
      return decodeUserIdFromToken();
    }
  })();

  // 1) FETCH CHAT HISTORY
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    axios
      .get(`https://backend-3ex6nbvuga-el.a.run.app/chat/history/${peerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data?.messages || []);
      })
      .catch((e) => console.error("History fetch error:", e));
  }, [peerId]);

  // 2) SOCKET SETUP
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    const s = createSocket();
    socketRef.current = s;

    // Incoming messages
    s.on("message", (msg) => {
      const from = String(msg.from);
      const to = String(msg.to);

      if (
        (from === String(me) && to === String(peerId)) ||
        (from === String(peerId) && to === String(me))
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m._id === msg._id ||
              (m.optimistic &&
                m.text === msg.text &&
                String(m.from) === from &&
                String(m.to) === to)
          );
          return exists ? prev : [...prev, msg];
        });
      }
    });

    return () => {
      s.disconnect();
    };
  }, [peerId, me]);

  // 3) SEND MESSAGE
  const send = () => {
    const text = input.trim();
    if (!text || !peerId) return;

    const s = socketRef.current;
    const tempId = `temp-${Date.now()}`;
    const token = localStorage.getItem("token");

    const optimistic = {
      _id: tempId,
      from: me,
      to: peerId,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    if (s && s.connected) {
      s.emit("send_message", { to: peerId, text }, (ack) => {
        if (ack?.ok && ack.message?._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? ack.message : m))
          );
        }
      });
      return;
    }

    axios
      .post(
        `https://backend-3ex6nbvuga-el.a.run.app/chat/send`,
        { to: peerId, text },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        const saved = res.data?.message;
        if (saved?._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? saved : m))
          );
        }
      })
      .catch((e) => console.error("REST send failed:", e));
  };

  // AUTO SCROLL
  useEffect(() => {
    const el = document.getElementById("chat-scroll");
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="chat-overlay">
      <div className="chat-window">
        
        {/* HEADER (NO ONLINE/OFFLINE) */}
        <div className="chat-header">
          <h3 className="chat-peer-name">{peerName || "User"}</h3>
          <button onClick={onClose} className="chat-close-btn">✕</button>
        </div>

        {/* CHAT BODY */}
        <div
          id="chat-scroll"
          className="chat-body"
          style={{ height: "65vh", overflowY: "auto", paddingRight: "8px" }}
        >
          {messages.map((m, i) => (
            <div
              key={m._id || i}
              className={`chat-bubble ${
                String(m.from) === String(me) ? "sent" : "received"
              }`}
            >
              <div className="chat-text">{m.text}</div>
              <div className="chat-time">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {m.optimistic ? " • sending..." : ""}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT BAR */}
        <div className="chat-input-bar">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
          />
          <button onClick={send} className="chat-send-btn">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
