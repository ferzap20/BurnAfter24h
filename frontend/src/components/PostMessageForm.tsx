import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Message } from '../types';
import { messageService } from '../services/messageService';
import { WarningDialog } from './WarningDialog';

interface PostMessageFormProps {
  onMessagePosted: (message: Message) => void;
}

const NICKNAME_MAX = 20;
const NICKNAME_MIN = 2;
const MESSAGE_MAX = 400;

export function PostMessageForm({ onMessagePosted }: PostMessageFormProps) {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nicknameValid =
    nickname.trim().length >= NICKNAME_MIN && nickname.trim().length <= NICKNAME_MAX;
  const messageValid = message.trim().length > 0 && message.trim().length <= MESSAGE_MAX;
  const canSubmit = nicknameValid && messageValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setShowWarning(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const posted = await messageService.postMessage(nickname.trim(), message.trim());
      onMessagePosted(posted);
      setNickname('');
      setMessage('');
      setShowWarning(false);
      toast.success('Message burned into the void 🔥', {
        style: { background: '#1a1a1a', color: '#e8e8e8', border: '1px solid #3a3a3a' },
        icon: '🔥',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post message';
      toast.error(msg, {
        style: { background: '#1a1a1a', color: '#e8e8e8', border: '1px solid #3a3a3a' },
      });
      setShowWarning(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          {/* Nickname */}
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname (2–20 chars)"
              maxLength={NICKNAME_MAX}
              className="w-full bg-ash-400 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-smoke-300 text-sm transition-all"
              autoComplete="off"
              spellCheck={false}
            />
            {nickname && !nicknameValid && (
              <p className="text-xs text-fire-400 mt-1 ml-1">
                {nickname.trim().length < NICKNAME_MIN
                  ? `Minimum ${NICKNAME_MIN} characters`
                  : `Maximum ${NICKNAME_MAX} characters`}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your anonymous message… it will burn in 24h"
              maxLength={MESSAGE_MAX}
              rows={4}
              className="w-full bg-ash-400 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-smoke-300 text-sm resize-none transition-all"
              spellCheck={false}
            />
            <span
              className={`absolute bottom-3 right-3 text-xs tabular-nums ${
                message.length > MESSAGE_MAX * 0.9
                  ? 'text-fire-400'
                  : 'text-smoke-300'
              }`}
            >
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 px-6 rounded-xl bg-fire-600 hover:bg-fire-500 disabled:bg-ash-50 disabled:text-smoke-300 text-white font-semibold transition-colors"
          >
            🔥 Post Anonymous Message
          </button>
        </div>
      </form>

      {showWarning && (
        <WarningDialog
          nickname={nickname.trim()}
          message={message.trim()}
          onConfirm={handleConfirm}
          onCancel={() => setShowWarning(false)}
          submitting={submitting}
        />
      )}
    </>
  );
}
