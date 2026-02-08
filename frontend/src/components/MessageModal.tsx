import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { useBurnAnimation } from '../hooks/useBurnAnimation';
import { CountryFlag } from './CountryFlag';
import { TimeRemaining } from './TimeRemaining';
import { ReportButton } from './ReportButton';

interface MessageModalProps {
  message: Message;
  onClose: () => void;
}

export function MessageModal({ message, onClose }: MessageModalProps) {
  const { burnState, opacity } = useBurnAnimation(message.expiresAt);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="modal-content relative max-w-lg w-full rounded-2xl border p-6 bg-ash-300 border-white/10"
        style={{ opacity }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-smoke-200 hover:text-white transition-colors text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <CountryFlag country={message.country} countryName={message.countryName} size={24} />
          <div>
            <div className="font-semibold text-white">{message.nickname}</div>
            <div className="text-xs text-smoke-200">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
          {message.isHighlighted && (
            <span className="ml-auto text-fire-300 text-sm">★ Highlighted</span>
          )}
        </div>

        {/* Message */}
        <div
          className={`rounded-xl p-4 mb-4 ${
            burnState === 'burning'
              ? 'bg-fire-900/20 border border-fire-700/30'
              : 'bg-white/5'
          }`}
        >
          <p className="text-base text-smoke-100 leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>

        {/* Burn indicator */}
        <div className="flex items-center justify-between">
          <TimeRemaining expiresAt={message.expiresAt} burnState={burnState} />
          <ReportButton messageId={message._id} />
        </div>

        {/* Warning for burning state */}
        {burnState === 'burning' && (
          <div className="mt-3 text-xs text-fire-400 text-center animate-pulse">
            ⚠ This message will burn soon
          </div>
        )}
      </div>
    </div>
  );
}
