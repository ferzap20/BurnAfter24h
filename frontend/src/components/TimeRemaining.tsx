import { useCountdown } from '../hooks/useCountdown';
import type { BurnState } from '../types';

interface TimeRemainingProps {
  expiresAt: string;
  burnState: BurnState;
}

const stateColors: Record<BurnState, string> = {
  normal: 'text-smoke-200',
  warning: 'text-fire-300',
  burning: 'text-fire-500',
};

export function TimeRemaining({ expiresAt, burnState }: TimeRemainingProps) {
  const countdown = useCountdown(expiresAt);

  return (
    <span className={`text-xs font-mono tabular-nums ${stateColors[burnState]}`}>
      🔥 {countdown}
    </span>
  );
}
