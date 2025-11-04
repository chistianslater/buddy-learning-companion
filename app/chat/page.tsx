"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Circle } from 'lucide-react';

// =============================================
// Type Definitions
// =============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

interface SessionInfo {
  sessionId: string;
  userContext: {
    name: string;
    gradeLevel: number;
    interests: Array<{ name: string; intensity: number }>;
  };
}

// =============================================
// Chat Page Component
// =============================================

export default function ChatPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    initializeChat();

    return () => {
      // Cleanup any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isSignedIn, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // =============================================
  // Chat Initialization
  // =============================================

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userContext: {
            gradeLevel: 3, // Default, would come from user profile
            federalState: 'Bayern', // Default, would come from user profile
          }
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start chat session');
      }

      setSessionInfo({
        sessionId: data.sessionId,
        userContext: {
          name: data.data.userContext.name || 'Freund',
          gradeLevel: data.data.userContext.gradeLevel || 3,
          interests: data.data.userContext.interests || []
        }
      });

      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: data.data.welcomeMessage,
        timestamp: new Date().toISOString()
      };

      setMessages([welcomeMessage]);

    } catch (err) {
      console.error('Error initializing chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');

      // Add fallback welcome message
      const fallbackMessage: Message = {
        id: 'fallback',
        role: 'assistant',
        content: 'Hallo! Ich bin dein Lernbegleiter. Worüber möchtest du heute gerne sprechen? 😊',
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // Message Handling
  // =============================================

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionInfo || isTyping) {
      return;
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);
    setSuggestedAction(null);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message',
          sessionId: sessionInfo.sessionId,
          message: userMessage.content
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Remove typing indicator and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.data.buddyResponse,
          timestamp: new Date().toISOString()
        }];
      });

      // Handle suggested action
      if (data.data.suggestedNextStep) {
        handleSuggestedAction(data.data.suggestedNextStep);
      }

    } catch (err) {
      console.error('Error sending message:', err);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      // Add error message or fallback response
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Entschuldigung, ich habe dich nicht verstanden. Kannst du das anders formulieren? 😊',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);

      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleSuggestedAction = (action: string) => {
    switch (action) {
      case 'take_break':
        setSuggestedAction('Möchtest du eine kleine Pause machen?');
        break;
      case 'change_topic':
        setSuggestedAction('Sollen wir über etwas anderes sprechen?');
        break;
      case 'end_session':
        setSuggestedAction('Danke für das Gespräch! Bis zum nächsten Mal! 🌟');
        break;
      default:
        setSuggestedAction(null);
    }
  };

  // =============================================
  // Utility Functions
  // =============================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =============================================
  // Loading State
  // =============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Lade deinen Lernbegleiter...
          </h2>
          <p className="text-slate-600">
            Einen Moment, ich bereite alles für dich vor. 😊
          </p>
        </Card>
      </div>
    );
  }

  // =============================================
  // Error State
  // =============================================

  if (error && !sessionInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <Circle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Etwas ist schiefgelaufen
          </h2>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <Button onClick={initializeChat} className="w-full">
            Erneut versuchen
          </Button>
        </Card>
      </div>
    );
  }

  // =============================================
  // Main Chat Interface
  // =============================================

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Dein Lernbegleiter
            </h1>
            {sessionInfo && (
              <p className="text-sm text-slate-600">
                Hallo {sessionInfo.userContext.name}! 🌟
              </p>
            )}
          </div>

          {sessionInfo && (
            <div className="text-right text-sm text-slate-600">
              <div>Klasse {sessionInfo.userContext.gradeLevel}</div>
              {sessionInfo.userContext.interests.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {sessionInfo.userContext.interests.slice(0, 3).map((interest, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {interest.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col px-4 py-6">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                userName={sessionInfo?.userContext.name || 'Du'}
              />
            ))}

            {suggestedAction && (
              <div className="text-center py-4">
                <p className="text-slate-600 italic mb-2">
                  {suggestedAction}
                </p>
                <div className="flex gap-2 justify-center">
                  {suggestedAction.includes('Pause') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputMessage('Ich mache gerne eine Pause');
                          setSuggestedAction(null);
                        }}
                      >
                        Ja, Pause machen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSuggestedAction(null)}
                      >
                        Weitermachen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Schreib deine Nachricht hier..."
                disabled={isTyping}
                className="flex-1"
                aria-label="Nachricht eingeben"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="icon"
                aria-label="Nachricht senden"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <QuickAction
                text="Ich brauche Hilfe"
                onClick={() => setInputMessage('Ich brauche Hilfe')}
                disabled={isTyping}
              />
              <QuickAction
                text="Das ist interessant"
                onClick={() => setInputMessage('Das ist interessant')}
                disabled={isTyping}
              />
              <QuickAction
                text="Ich verstehe nicht"
                onClick={() => setInputMessage('Ich verstehe nicht')}
                disabled={isTyping}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================
// Message Bubble Component
// =============================================

interface MessageBubbleProps {
  message: Message;
  userName: string;
}

function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (message.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200">
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" />
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white rounded-tl-none border border-slate-200'
          }`}
        >
          <p className={`text-sm leading-relaxed ${
            isUser ? 'text-white' : 'text-slate-800'
          }`}>
            {message.content}
          </p>
        </div>
        <p className={`text-xs text-slate-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// =============================================
// Quick Action Component
// =============================================

interface QuickActionProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

function QuickAction({ text, onClick, disabled = false }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-xs"
    >
      {text}
    </Button>
  );
}