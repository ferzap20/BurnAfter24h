import { useEffect, useRef } from 'react';

interface WarningDialogProps {
  nickname: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export function WarningDialog({
  nickname,
  message,
  onConfirm,
  onCancel,
  submitting,
}: WarningDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onCancel}
    >
      <div
        className="modal-content max-w-md w-full rounded-2xl border p-6 bg-ash-300 border-fire-700/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🔥</div>
          <h2 className="text-xl font-bold text-white">Ready to burn?</h2>
        </div>

        {/* Warning text */}
        <div className="bg-fire-900/20 border border-fire-700/30 rounded-xl p-4 mb-4">
          <p className="text-fire-300 text-sm font-medium text-center">
            ⚠ This message will disappear forever after 24 hours.
          </p>
          <p className="text-smoke-200 text-xs text-center mt-1">
            There is no way to recover it.
          </p>
        </div>

        {/* Preview */}
        <div className="bg-white/5 rounded-xl p-3 mb-5">
          <div className="text-xs text-smoke-300 mb-1">Posting as: <span className="text-white">{nickname}</span></div>
          <p className="text-sm text-smoke-100 line-clamp-3">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-smoke-200 hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-xl bg-fire-600 hover:bg-fire-500 text-white transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? '🔥 Burning…' : '🔥 Burn It'}
          </button>
        </div>
      </div>
    </div>
  );
}
