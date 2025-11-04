"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Circle, Sun, Moon } from 'lucide-react';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { SessionControls } from '@/components/chat/SessionControls';
import { AccessibilityHelper, AccessibilitySettings, accessibilityStyles } from '@/components/chat/AccessibilityHelper';
import { KeyboardHelp } from '@/components/chat/KeyboardHelp';

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

interface EngagementMetrics {
  sessionDuration: number;
  messageCount: number;
  averageResponseTime: number;
  engagementLevel: number;
}

// =============================================
// Enhanced Chat Page Component
// =============================================

export default function EnhancedChatPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null);

  // Enhanced states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState<EngagementMetrics>({
    sessionDuration: 0,
    messageCount: 0,
    averageResponseTime: 0,
    engagementLevel: 0
  });
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionStartTime = useRef<Date>(new Date());
  const messageStartTime = useRef<Date>(new Date());

  // Accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    soundEnabled: true,
    reducedMotion: false,
    darkMode: false,
    keyboardShortcuts: true
  });

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    setAccessibilitySettings(prev => ({ ...prev, darkMode: prefersDark }));

    // Add accessibility styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = accessibilityStyles;
    styleElement.id = 'accessibility-styles';
    document.head.appendChild(styleElement);

    // Set up keyboard shortcuts
    if (accessibilitySettings.keyboardShortcuts) {
      setupKeyboardShortcuts();
    }

    initializeChat();

    // Start session metrics tracking
    const metricsInterval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000 / 60);
      setSessionMetrics(prev => ({ ...prev, sessionDuration: duration }));
    }, 30000); // Update every 30 seconds

    return () => {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearInterval(metricsInterval);
      const styleEl = document.getElementById('accessibility-styles');
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [isSignedIn, router, accessibilitySettings.keyboardShortcuts]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Smart focus management
    if (inputRef.current && !isLoading && !isTyping) {
      inputRef.current.focus();
    }
  }, [isLoading, isTyping]);

  // =============================================
  // Keyboard Shortcuts
  // =============================================

  const setupKeyboardShortcuts = useCallback(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in input field
    if (document.activeElement === inputRef.current) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
      return;
    }

    const isCtrl = event.ctrlKey || event.metaKey;

    switch (true) {
      case isCtrl && event.key === 'Enter':
        event.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
        break;

      case isCtrl && event.key === '/':
        event.preventDefault();
        // Toggle accessibility helper (would need state management)
        break;

      case isCtrl && event.key === 'k':
        event.preventDefault();
        handleChangeTopic();
        break;

      case isCtrl && event.key === 'p':
        event.preventDefault();
        handleTakeBreak();
        break;

      case isCtrl && event.key === 'Escape':
        event.preventDefault();
        handleEndSession();
        break;

      case event.key === 'Tab':
        // Allow default tab behavior for accessibility
        break;

      case event.key === '?':
        if (!isCtrl) {
          event.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
        }
        break;
    }
  }, [showKeyboardHelp]);

  // =============================================
  // Chat Initialization
  // =============================================

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      sessionStartTime.current = new Date();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          userContext: {
            gradeLevel: 3,
            federalState: 'Bayern',
            sensitivitySettings: {
              visual_stimulus: accessibilitySettings.highContrast ? 'low' : 'medium',
              auditory_stimulus: accessibilitySettings.soundEnabled ? 'medium' : 'low',
              cognitive_load: 'medium'
            }
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

      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: data.data.welcomeMessage,
        timestamp: new Date().toISOString()
      };

      setMessages([welcomeMessage]);
      setSessionMetrics(prev => ({ ...prev, messageCount: 1 }));

      // Play welcome sound if enabled
      if (accessibilitySettings.soundEnabled) {
        playNotificationSound('welcome');
      }

    } catch (err) {
      console.error('Error initializing chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');

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
  // Enhanced Message Handling
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
    messageStartTime.current = new Date();

    // Update metrics
    setSessionMetrics(prev => ({
      ...prev,
      messageCount: prev.messageCount + 1
    }));

    // Play send sound if enabled
    if (accessibilitySettings.soundEnabled) {
      playNotificationSound('send');
    }

    try {
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

      // Calculate response time
      const responseTime = Date.now() - messageStartTime.current.getTime();
      setSessionMetrics(prev => ({
        ...prev,
        averageResponseTime: Math.round(
          (prev.averageResponseTime * (prev.messageCount - 1) + responseTime) / prev.messageCount
        )
      }));

      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.data.buddyResponse,
          timestamp: new Date().toISOString()
        }];
      });

      // Play response sound if enabled
      if (accessibilitySettings.soundEnabled) {
        playNotificationSound('message');
      }

      // Update engagement level based on response
      const engagementLevel = calculateEngagementLevel(userMessage.content, data.data.buddyResponse);
      setSessionMetrics(prev => ({
        ...prev,
        engagementLevel
      }));

      if (data.data.suggestedNextStep) {
        handleSuggestedAction(data.data.suggestedNextStep);
      }

    } catch (err) {
      console.error('Error sending message:', err);

      setMessages(prev => prev.filter(msg => !msg.isTyping));

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Entschuldigung, ich habe dich nicht verstanden. Kannst du das anders formulieren? 😊',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);

      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        playNotificationSound('error');
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
      setLastMessageTime(new Date());
    }
  };

  // =============================================
  // Session Control Functions
  // =============================================

  const handleTakeBreak = useCallback(() => {
    setSuggestedAction('Möchtest du eine kleine Pause machen? Wir können später weitermachen. 😊');
    setInputMessage('Ich mache gerne eine Pause');
  }, []);

  const handleChangeTopic = useCallback(() => {
    setSuggestedAction('Worüber möchtest du gerne sprechen? Ich bin für alle Themen da! 🌟');
    setInputMessage('Lass uns über etwas anderes sprechen');
  }, []);

  const handleRestart = useCallback(() => {
    initializeChat();
  }, []);

  const handleEndSession = useCallback(async () => {
    if (!sessionInfo) return;

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: sessionInfo.sessionId
        })
      });
    } catch (err) {
      console.error('Error ending session:', err);
    }

    // Show final message
    const endMessage: Message = {
      id: 'end',
      role: 'assistant',
      content: 'Danke für unser Gespräch! Das war wirklich schön. Bis zum nächsten Mal! 🌟',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, endMessage]);
    setSuggestedAction('Session beendet. Lade die Seite neu, um eine neue Session zu starten.');
  }, [sessionInfo]);

  const handleSettings = useCallback(() => {
    // Would open settings modal or navigate to settings page
    setShowKeyboardHelp(true);
  }, []);

  // =============================================
  // Utility Functions
  // =============================================

  const calculateEngagementLevel = (userMessage: string, buddyResponse: string): number => {
    let score = 50; // Base score

    // User message factors
    if (userMessage.length > 10) score += 10;
    if (userMessage.includes('weil') || userMessage.includes('denn')) score += 15;
    if (userMessage.split(' ').length > 5) score += 10;

    // Buddy response factors
    if (buddyResponse.includes('😊') || buddyResponse.includes('🤔') || buddyResponse.includes('🌟')) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  };

  const playNotificationSound = (type: 'welcome' | 'send' | 'message' | 'error') => {
    if (!accessibilitySettings.soundEnabled) return;

    try {
      // Create simple audio feedback using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies = {
        welcome: 523.25,    // C5
        send: 440,          // A4
        message: 659.25,    // E5
        error: 220          // A3
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  };

  const scrollToBottom = () => {
    if (!accessibilitySettings.reducedMotion) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
        <Card className="w-full max-w-md p-8 text-center bg-white dark:bg-slate-800">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Lade deinen Lernbegleiter...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Einen Moment, ich bereite alles für dich vor. 😊
          </p>
        </Card>
      </div>
    );
  }

  // =============================================
  // Main Chat Interface
  // =============================================

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Styles */}
      <style jsx global>{accessibilityStyles}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Dein Lernbegleiter
            </h1>
            {sessionInfo && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hallo {sessionInfo.userContext.name}! 🌟
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {sessionInfo && (
              <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                <div>Klasse {sessionInfo.userContext.gradeLevel}</div>
                {sessionInfo.userContext.interests.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {sessionInfo.userContext.interests.slice(0, 3).map((interest, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        {interest.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label={isDarkMode ? "Lichtmodus" : "Dunkler Modus"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
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
                reducedMotion={accessibilitySettings.reducedMotion}
              />
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <TypingIndicator isVisible={true} />
                  </div>
                </div>
              </div>
            )}

            {suggestedAction && (
              <div className="text-center py-4">
                <p className="text-slate-600 dark:text-slate-400 italic mb-2">
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
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Schreib deine Nachricht hier..."
                disabled={isTyping}
                className="flex-1"
                aria-label="Nachricht eingeben"
                maxLength={500} // Prevent overwhelming long messages
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

      {/* Session Controls */}
      {sessionInfo && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto">
            <SessionControls
              onTakeBreak={handleTakeBreak}
              onChangeTopic={handleChangeTopic}
              onRestart={handleRestart}
              onEndSession={handleEndSession}
              onSettings={handleSettings}
              isSoundEnabled={accessibilitySettings.soundEnabled}
              onToggleSound={() => setAccessibilitySettings(prev => ({
                ...prev,
                soundEnabled: !prev.soundEnabled
              }))}
              sessionDuration={sessionMetrics.sessionDuration}
              messageCount={sessionMetrics.messageCount}
            />
          </div>
        </div>
      )}

      {/* Accessibility Helper */}
      <AccessibilityHelper
        settings={accessibilitySettings}
        onSettingsChange={setAccessibilitySettings}
        onShowHelp={() => setShowKeyboardHelp(true)}
      />

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <KeyboardHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </div>
  );
}

// =============================================
// Message Bubble Component
// =============================================

interface MessageBubbleProps {
  message: Message;
  userName: string;
  reducedMotion?: boolean;
}

function MessageBubble({ message, userName, reducedMotion = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (message.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" />
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" style={{
                animationDelay: reducedMotion ? '0s' : '0.2s'
              }} />
              <Circle className="h-2 w-2 text-slate-400 animate-pulse" style={{
                animationDelay: reducedMotion ? '0s' : '0.4s'
              }} />
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
              : 'bg-white dark:bg-slate-800 rounded-tl-none border border-slate-200 dark:border-slate-700'
          }`}
        >
          <p className={`text-sm leading-relaxed ${
            isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'
          }`}>
            {message.content}
          </p>
        </div>
        <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
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