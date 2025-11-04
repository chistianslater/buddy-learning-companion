"use client";

import { useEffect, useState } from 'react';
import { Circle } from 'lucide-react';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  delay?: number;
}

export function TypingIndicator({
  isVisible,
  message = "Dein Lernbegleiter schreibt...",
  delay = 500
}: TypingIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowIndicator(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setShowIndicator(false);
    }
  }, [isVisible, delay]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-slate-600 text-sm animate-fade-in">
      <div className="flex items-center gap-1">
        <Circle className="h-2 w-2 text-blue-600 animate-pulse" />
        <Circle className="h-2 w-2 text-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <Circle className="h-2 w-2 text-blue-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="text-slate-500">{message}</span>
    </div>
  );
}