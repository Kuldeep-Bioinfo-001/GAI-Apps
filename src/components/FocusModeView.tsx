import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Check, ArrowLeft, Clock, Bell, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, UserSettings } from '../types/task';
import { CATEGORY_META_MAP, PRIORITY_META_MAP } from '../utils/categoryTheme';
import { playNotificationSound } from '../services/notificationService';
import { formatTimeDisplay } from '../utils/timeUtils';

interface FocusModeViewProps {
  task: Task;
  settings: UserSettings;
  onExit: () => void;
  onCompleteTask: (taskId: string) => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  task,
  settings,
  onExit,
  onCompleteTask,
}) => {
  // Default timer to 25 minutes (standard Pomodoro) or task duration
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(true);

  const catMeta = CATEGORY_META_MAP[task.category] || CATEGORY_META_MAP['Other'];
  const priorityMeta = PRIORITY_META_MAP[task.priority] || PRIORITY_META_MAP['Medium'];
  const CatIcon = catMeta.icon;

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (settings.soundEnabled) {
              playNotificationSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, remainingSeconds, settings.soundEnabled]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  const setTimerPreset = (mins: number) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
  };

  const handleComplete = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6'],
      });
    } catch {
      // ignore
    }
    onCompleteTask(task.id);
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Deep Focus Session</span>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="max-w-xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        {/* Category & Scheduled Time */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
          <div className="flex items-center gap-1.5">
            <CatIcon className={`w-4 h-4 ${catMeta.color}`} />
            <span>{task.category}</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono">{formatTimeDisplay(task.startTime, settings.clockFormat)}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className={priorityMeta.textClass}>{task.priority} Priority</span>
        </div>

        {/* Task Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 max-w-lg">
          {task.title}
        </h1>

        {task.description && (
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Circular Countdown Ring */}
        <div className="relative my-6 flex items-center justify-center">
          <svg className="w-64 h-64 -rotate-90 transform">
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-900"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - progressRatio)}
              strokeLinecap="round"
              className="text-indigo-500 transition-all duration-1000 ease-linear"
              fill="transparent"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-extrabold font-mono tabular-nums tracking-tight">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold">
              {remainingSeconds === 0 ? 'Time Up!' : isRunning ? 'Remaining' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 mb-6">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => setTimerPreset(mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                totalSeconds === mins * 60
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setRemainingSeconds(totalSeconds);
            }}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Complete</span>
          </button>
        </div>

        {/* Task Notes Section in Focus Mode */}
        {task.notes && (
          <div className="mt-8 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left max-w-md w-full">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Notes & References
            </h5>
            <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {task.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
