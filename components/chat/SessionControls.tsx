"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Coffee,
  Pause,
  RotateCcw,
  LogOut,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface SessionControlsProps {
  onTakeBreak: () => void;
  onChangeTopic: () => void;
  onRestart: () => void;
  onEndSession: () => void;
  onSettings: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  sessionDuration?: number;
  messageCount?: number;
}

export function SessionControls({
  onTakeBreak,
  onChangeTopic,
  onRestart,
  onEndSession,
  onSettings,
  isSoundEnabled,
  onToggleSound,
  sessionDuration = 0,
  messageCount = 0
}: SessionControlsProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} Min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}Min`;
  };

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">Session Steuerung</h3>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{formatDuration(sessionDuration)}</span>
          <span>•</span>
          <span>{messageCount} Nachrichten</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onTakeBreak}
          className="flex items-center gap-2 text-xs"
        >
          <Coffee className="h-3 w-3" />
          Pause
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onChangeTopic}
          className="flex items-center gap-2 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Thema wechseln
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSound}
            className="h-8 w-8 p-0"
            aria-label={isSoundEnabled ? "Ton aus" : "Ton an"}
          >
            {isSoundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSettings}
            className="h-8 w-8 p-0"
            aria-label="Einstellungen"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEndSession}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-red-600"
        >
          <LogOut className="h-3 w-3" />
          Beenden
        </Button>
      </div>
    </Card>
  );
}