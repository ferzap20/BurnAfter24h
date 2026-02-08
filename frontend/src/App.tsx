import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useMessages } from './hooks/useMessages';
import { PostMessageForm } from './components/PostMessageForm';
import { MessageCloud } from './components/MessageCloud';

export default function App() {
  const { messages, loading, error, addMessage, removeMessage, lastUpdated } = useMessages();
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ash-700/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h1 className="text-lg font-bold text-white">Burn After 24h</h1>
              <p className="text-xs text-smoke-200">Anonymous messages that self-destruct</p>
            </div>
          </div>
          <div className="flex items-center gap-4 hidden sm:flex">
            <span className="text-xs text-smoke-300">All messages expire in 24 hours</span>
            <button
              onClick={() => setShowSupport(true)}
              className="text-xs text-fire-300 hover:text-fire-200 transition-colors cursor-pointer font-medium"
            >
              Support my work
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Post form */}
        <section>
          <PostMessageForm onMessagePosted={addMessage} />
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-smoke-300 font-medium">🌑 BURN CLOUD</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Message cloud */}
        <section>
          <MessageCloud
            messages={messages}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            onReport={removeMessage}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-smoke-400">
        <p>Messages burn forever after 24 hours. No accounts, no traces.</p>
      </footer>

      {/* Support modal */}
      {showSupport && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowSupport(false)}
        >
          <div
            className="modal-content relative max-w-md w-full rounded-2xl border p-6 bg-ash-300 border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSupport(false)}
              className="absolute top-4 right-4 text-smoke-200 hover:text-white transition-colors text-lg cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="text-3xl">🔥</div>
              <h2 className="text-lg font-bold text-white">Support My Work</h2>
              <p className="text-sm text-smoke-100 leading-relaxed">
                If you enjoy Burn After 24h, consider buying me a coffee to help keep the fire burning. Your support helps me build more cool projects like this one.
              </p>
              <div className="flex justify-center pt-2">
                <a href="https://www.buymeacoffee.com/ferzap" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png"
                    alt="Buy Me A Coffee"
                    className="h-[60px] w-[217px] hover:opacity-80 transition-opacity"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster position="bottom-center" />
    </div>
  );
}
