import { useState } from 'react';
import type { Message } from '../types';
import { MessageCard } from './MessageCard';
import { MessageModal } from './MessageModal';

interface MessageCloudProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function MessageCloud({ messages, loading, error, lastUpdated }: MessageCloudProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-smoke-200">
        <div className="text-4xl mb-3 animate-pulse">🔥</div>
        <p>Loading the burn cloud…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-fire-400">
        <div className="text-4xl mb-3">💀</div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Cloud header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-smoke-200">
          {messages.length === 0
            ? 'No messages yet. Be the first to burn.'
            : `${messages.length} message${messages.length !== 1 ? 's' : ''} burning`}
        </h2>
        {lastUpdated && (
          <span className="text-xs text-smoke-400">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center py-16 text-smoke-300">
          <div className="text-6xl mb-4">🌑</div>
          <p className="text-sm">The void is empty. Leave your mark.</p>
        </div>
      )}

      {/* Message grid */}
      {messages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((msg) => (
            <MessageCard
              key={msg._id}
              message={msg}
              onClick={setSelectedMessage}
            />
          ))}
        </div>
      )}

      {/* Message modal */}
      {selectedMessage && (
        <MessageModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </>
  );
}
