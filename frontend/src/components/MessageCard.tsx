import type { Message } from '../types';
import { useBurnAnimation } from '../hooks/useBurnAnimation';
import { CountryFlag } from './CountryFlag';
import { TimeRemaining } from './TimeRemaining';
import { ReportButton } from './ReportButton';

interface MessageCardProps {
  message: Message;
  onClick: (message: Message) => void;
  onReport?: (id: string) => void;
}

export function MessageCard({ message, onClick, onReport }: MessageCardProps) {
  const { burnState, burnProgress, opacity } = useBurnAnimation(message.expiresAt);

  const truncated =
    message.message.length > 120
      ? message.message.slice(0, 117) + '…'
      : message.message;

  return (
    <div
      className={`message-card state-${burnState} relative cursor-pointer rounded-xl p-4 border select-none ${
        message.isHighlighted
          ? 'bg-fire-900/20 border-fire-600/40'
          : 'bg-white/5 border-white/10'
      } ${burnState === 'burning' ? 'border-fire-700/40' : ''}`}
      style={{ opacity }}
      onClick={() => onClick(message)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(message)}
      aria-label={`Message from ${message.nickname}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <CountryFlag country={message.country} countryName={message.countryName} />
          <span className="font-semibold text-sm text-white truncate">
            {message.nickname}
          </span>
          {message.isHighlighted && (
            <span className="text-xs text-fire-300">★</span>
          )}
        </div>
        <TimeRemaining expiresAt={message.expiresAt} burnState={burnState} />
      </div>

      {/* Message preview */}
      <p className="text-sm text-smoke-100 leading-relaxed mb-3">{truncated}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-smoke-300">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <ReportButton messageId={message._id} onReport={onReport} />
      </div>

      {/* Burn progress bar */}
      {burnState === 'burning' && burnProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden bg-white/5">
          <div
            className="flame-bar h-full rounded-b-xl"
            style={{ width: `${burnProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
