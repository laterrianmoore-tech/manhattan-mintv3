'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const STORAGE_KEY = 'mm_chat_history';
const AUTO_OPEN_KEY = 'mm_chat_auto_opened';
const AUTO_OPEN_PATHS = ['/quote', '/pricing-availability'];
const AUTO_OPEN_DELAY_MS = 10_000;

// Renders **bold** spans inside a plain-text segment.
function renderBold(text: string, keyPrefix: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-b-${i}`}>{part}</strong>
    ) : (
      <span key={`${keyPrefix}-t-${i}`}>{part}</span>
    ),
  );
}

function renderContent(text: string, lineKey: number) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(...renderBold(text.slice(last, match.index), `t-${last}`));
    }
    const href = match[2];
    const isExternal = href.startsWith('http');
    nodes.push(
      <a
        key={`l-${match.index}`}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        style={{ textDecoration: 'underline', color: '#1d9e75' }}
      >
        {match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(...renderBold(text.slice(last), `t-${last}`));
  }

  return <p key={lineKey} style={{ margin: '2px 0' }}>{nodes}</p>;
}

function renderMessage(content: string) {
  return content.split('\n').map((line, i) => renderContent(line, i));
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Restore messages from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-open on qualifying pages after idle delay
  useEffect(() => {
    if (!AUTO_OPEN_PATHS.includes(pathname)) return;
    try {
      if (sessionStorage.getItem(AUTO_OPEN_KEY)) return;
    } catch {}

    const timer = setTimeout(() => {
      setIsOpen((prev) => {
        if (prev) return prev;
        try { sessionStorage.setItem(AUTO_OPEN_KEY, '1'); } catch {}
        return true;
      });
    }, AUTO_OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeWidget();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const sel = 'button,[href],input,textarea,[tabindex]:not([tabindex="-1"])';
    const trapHandler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(sel));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', trapHandler);
    return () => document.removeEventListener('keydown', trapHandler);
  }, [isOpen]);

  function closeWidget() {
    setIsOpen(false);
    try { sessionStorage.setItem(AUTO_OPEN_KEY, '1'); } catch {}
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
      }
    : {
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 380,
        height: 600,
        borderRadius: 12,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
      };

  return (
    <>
      {/* Floating button — positioned above the "Book a clean" float-cta */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat with Manhattan Mint"
          style={{
            position: 'fixed',
            bottom: isMobile ? 80 : 96,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#1d9e75',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(29,158,117,0.45)',
            zIndex: 9999,
          }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div ref={panelRef} role="dialog" aria-label="Manhattan Mint chat" aria-modal="true" style={panelStyle}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#1d9e75',
              color: '#fff',
              borderRadius: isMobile ? 0 : '12px 12px 0 0',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>Chat with Manhattan Mint</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href="/quote"
                style={{
                  background: '#fff',
                  color: '#1d9e75',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Get a quote →
              </a>
              <button
                onClick={closeWidget}
                aria-label="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: '#888', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
                Hi! Ask me anything about pricing, availability, or booking a clean.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: msg.role === 'user' ? '#1d9e75' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : '#0f0f0f',
                  borderRadius:
                    msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '8px 12px',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {msg.content
                  ? renderMessage(msg.content)
                  : streaming && i === messages.length - 1
                  ? <span style={{ opacity: 0.4 }}>▊</span>
                  : null}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '8px 12px 12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={streaming}
              aria-label="Chat message input"
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                maxHeight: 100,
                overflowY: 'auto',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              aria-label="Send message"
              style={{
                background: '#1d9e75',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                width: 36,
                height: 36,
                cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: streaming || !input.trim() ? 0.45 : 1,
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
