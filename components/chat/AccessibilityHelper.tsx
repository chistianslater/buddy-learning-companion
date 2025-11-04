"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Eye,
  EyeOff,
  Type,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Keyboard
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  keyboardShortcuts: boolean;
}

interface AccessibilityHelperProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  onShowHelp: () => void;
}

export function AccessibilityHelper({
  settings,
  onSettingsChange,
  onShowHelp
}: AccessibilityHelperProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  useEffect(() => {
    // Apply settings to document
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('large-text', settings.largeText);
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        className="rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
        aria-label="Barrierefreiheitsoptionen"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      {/* Settings Panel */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 p-4 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800">Barrierefreiheit</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label="Schließen"
            >
              ×
            </Button>
          </div>

          <div className="space-y-3">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Hoher Kontrast
              </label>
              <Button
                variant={settings.highContrast ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                aria-pressed={settings.highContrast}
              >
                {settings.highContrast ? "An" : "Aus"}
              </Button>
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Große Schrift
              </label>
              <Button
                variant={settings.largeText ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('largeText', !settings.largeText)}
                aria-pressed={settings.largeText}
              >
                {settings.largeText ? "An" : "Aus"}
              </Button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Ton
              </label>
              <Button
                variant={settings.soundEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                aria-pressed={settings.soundEnabled}
              >
                {settings.soundEnabled ? "An" : "Aus"}
              </Button>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700 flex items-center gap-2">
                {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Dunkler Modus
              </label>
              <Button
                variant={settings.darkMode ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('darkMode', !settings.darkMode)}
                aria-pressed={settings.darkMode}
              >
                {settings.darkMode ? "An" : "Aus"}
              </Button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">
                Weniger Bewegung
              </label>
              <Button
                variant={settings.reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                aria-pressed={settings.reducedMotion}
              >
                {settings.reducedMotion ? "An" : "Aus"}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHelp}
              className="w-full"
            >
              Tastaturkürzel anzeigen
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// CSS classes for accessibility features
export const accessibilityStyles = `
.high-contrast {
  --bg-primary: 0 0% 100%;
  --bg-secondary: 0 0% 0%;
  --text-primary: 0 0% 0%;
  --text-secondary: 0 0% 100%;
}

.large-text {
  font-size: 118%;
  line-height: 1.6;
}

.large-text * {
  font-size: inherit;
}

.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

@media (prefers-reduced-motion: reduce) {
  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Keyboard shortcuts
export const keyboardShortcuts = {
  'Ctrl/Cmd + Enter': 'Nachricht senden',
  'Ctrl/Cmd + /': 'Barrierefreiheit öffnen',
  'Ctrl/Cmd + K': 'Thema wechseln',
  'Ctrl/Cmd + P': 'Pause machen',
  'Ctrl/Cmd + Escape': 'Session beenden',
  'Tab': 'Zwischen Elementen navigieren',
  'Enter': 'Auswählen/Bestätigen',
  'Esc': 'Dialog schließen'
};