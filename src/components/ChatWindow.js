import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const ChatWindow = ({ requestId, currentUser, onClose, title = 'Support Chat' }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!requestId) return;

        const q = query(
            collection(db, 'chats', requestId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [requestId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, viewportHeight]);

    // Handle mobile keyboard: use visualViewport to track actual visible area
    const handleViewportResize = useCallback(() => {
        if (window.visualViewport) {
            setViewportHeight(window.visualViewport.height);
        } else {
            setViewportHeight(window.innerHeight);
        }
    }, []);

    useEffect(() => {
        // Lock body scroll
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalTop = document.body.style.top;
        const originalWidth = document.body.style.width;
        const scrollY = window.scrollY;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        // Listen to visualViewport resize (fires when keyboard opens/closes)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportResize);
            window.visualViewport.addEventListener('scroll', handleViewportResize);
        }
        window.addEventListener('resize', handleViewportResize);

        // Set initial height
        handleViewportResize();

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.top = originalTop;
            document.body.style.width = originalWidth;
            window.scrollTo(0, scrollY);

            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportResize);
                window.visualViewport.removeEventListener('scroll', handleViewportResize);
            }
            window.removeEventListener('resize', handleViewportResize);
        };
    }, [handleViewportResize]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await addDoc(collection(db, 'chats', requestId, 'messages'), {
            text: newMessage,
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
        });

        setNewMessage('');
        // Keep the input focused after sending
        inputRef.current?.focus();
    };

    const handleInputFocus = () => {
        // Give the keyboard time to open, then scroll to bottom
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    };

    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate the offset for visualViewport (keyboard pushes viewport up)
    const vpOffsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: `${vpOffsetTop}px`,
                left: 0,
                width: '100%',
                height: `${viewportHeight}px`,
                backgroundColor: '#f0f2f5',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2000,
                overflowY: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #f47c20, #e06800)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '22px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    aria-label="Go back"
                >
                    ←
                </button>
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                    }}
                >
                    🎧
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</div>
                    <div style={{ fontSize: '12px', opacity: 0.85 }}>Online</div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    WebkitOverflowScrolling: 'touch',
                    minHeight: 0,
                }}
            >
                {messages.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#999',
                            marginTop: '40px',
                            fontSize: '14px',
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                        No messages yet. Start the conversation!
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.uid;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '78%',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: isMe ? '#f47c20' : '#ffffff',
                                    color: isMe ? 'white' : '#1a1a1a',
                                    padding: '10px 14px',
                                    borderRadius: isMe
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    wordWrap: 'break-word',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                    fontSize: '15px',
                                    lineHeight: '1.4',
                                }}
                            >
                                {msg.text}
                            </div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: '#999',
                                    marginTop: '3px',
                                    textAlign: isMe ? 'right' : 'left',
                                    paddingLeft: isMe ? 0 : '6px',
                                    paddingRight: isMe ? '6px' : 0,
                                }}
                            >
                                {formatTime(msg.createdAt)}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
                className="chat-input-form"
                onSubmit={handleSendMessage}
                style={{
                    padding: '10px 12px',
                    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    flexShrink: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Type a message..."
                    style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        padding: '12px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '24px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: '#f5f5f5',
                        boxSizing: 'border-box',
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: 'none',
                        background: newMessage.trim()
                            ? 'linear-gradient(135deg, #f47c20, #e06800)'
                            : '#ccc',
                        color: 'white',
                        fontSize: '20px',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                    }}
                >
                    ➤
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
