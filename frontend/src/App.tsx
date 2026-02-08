import { Toaster } from 'react-hot-toast';
import { useMessages } from './hooks/useMessages';
import { PostMessageForm } from './components/PostMessageForm';
import { MessageCloud } from './components/MessageCloud';

export default function App() {
  const { messages, loading, error, addMessage, lastUpdated } = useMessages();

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
          <div className="text-xs text-smoke-300 hidden sm:block">
            All messages expire in 24 hours
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
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-smoke-400">
        <p>Messages burn forever after 24 hours. No accounts, no traces.</p>
      </footer>

      {/* Toast notifications */}
      <Toaster position="bottom-center" />
    </div>
  );
}
