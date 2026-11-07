import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white border border-slate-700 px-3.5 py-2 text-xs font-medium shadow-lg animate-in fade-in duration-200">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Working Offline · Changes saved to local device</span>
    </div>
  );
};
