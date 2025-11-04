"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Keyboard } from 'lucide-react';

interface KeyboardHelpProps {
  onClose: () => void;
}

export function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  const shortcuts = [
    { key: 'Strg + Enter', description: 'Nachricht senden' },
    { key: 'Strg + /', description: 'Barrierefreiheit öffnen' },
    { key: 'Strg + K', description: 'Thema wechseln' },
    { key: 'Strg + P', description: 'Pause machen' },
    { key: 'Strg + Esc', description: 'Session beenden' },
    { key: 'Tab', description: 'Zwischen Elementen navigieren' },
    { key: 'Enter', description: 'Auswählen/Bestätigen' },
    { key: 'Esc', description: 'Dialog schließen' },
    { key: '?', description: 'Diese Hilfe anzeigen' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Tastaturkürzel
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-2 mb-6">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <kbd className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-300 dark:border-slate-600">
                  {shortcut.key}
                </kbd>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            <p className="mb-2">
              <strong>Tipp:</strong> Du kannst diese Kürzel verwenden, um die App schneller zu bedienen, auch ohne Maus.
            </p>
            <p>
              Strg auf Windows entspricht der Cmd-Taste auf Mac.
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full"
            aria-label="Hilfe schließen und zum Chat zurückkehren"
          >
            Verstanden
          </Button>
        </div>
      </Card>
    </div>
  );
}