import { useState } from 'react';
import toast from 'react-hot-toast';
import { reportService } from '../services/reportService';

interface ReportButtonProps {
  messageId: string;
  onReport?: (id: string) => void;
}

const REPORTED_KEY = 'burn_reported_messages';

function getReportedMessages(): Set<string> {
  try {
    const data = localStorage.getItem(REPORTED_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

function markAsReported(id: string): void {
  const reported = getReportedMessages();
  reported.add(id);
  localStorage.setItem(REPORTED_KEY, JSON.stringify(Array.from(reported)));
}

export function ReportButton({ messageId, onReport }: ReportButtonProps) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(() => getReportedMessages().has(messageId));

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening

    if (reported || reporting) return;

    setReporting(true);
    try {
      await reportService.reportMessage(messageId);
      markAsReported(messageId);
      setReported(true);
      onReport?.(messageId);
      toast.success('Report submitted — message hidden', {
        style: { background: '#1a1a1a', color: '#e8e8e8', border: '1px solid #3a3a3a' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to report';
      toast.error(msg, {
        style: { background: '#1a1a1a', color: '#e8e8e8', border: '1px solid #3a3a3a' },
      });
    } finally {
      setReporting(false);
    }
  };

  return (
    <button
      onClick={handleReport}
      disabled={reported || reporting}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        reported
          ? 'text-smoke-300 cursor-default'
          : 'text-smoke-200 hover:text-fire-400 hover:bg-ash-50/50 cursor-pointer'
      }`}
      title={reported ? 'Already reported' : 'Report this message'}
    >
      {reported ? '⚑ Reported' : reporting ? '…' : '⚑ Report'}
    </button>
  );
}
