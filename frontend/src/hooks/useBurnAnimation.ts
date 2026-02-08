import { useState, useEffect } from 'react';
import type { BurnState } from '../types';

interface BurnAnimationState {
  burnState: BurnState;
  burnProgress: number; // 0-100
  opacity: number; // 0.3-1.0
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function useBurnAnimation(expiresAt: string): BurnAnimationState {
  const [state, setState] = useState<BurnAnimationState>({
    burnState: 'normal',
    burnProgress: 0,
    opacity: 1,
  });

  useEffect(() => {
    const compute = () => {
      const timeRemaining = new Date(expiresAt).getTime() - Date.now();

      if (timeRemaining <= 0) {
        setState({ burnState: 'burning', burnProgress: 100, opacity: 0.3 });
        return;
      }

      if (timeRemaining > THREE_HOURS_MS) {
        setState({ burnState: 'normal', burnProgress: 0, opacity: 1 });
      } else if (timeRemaining > ONE_HOUR_MS) {
        // Warning state: 1-3 hours remaining
        setState({ burnState: 'warning', burnProgress: 0, opacity: 1 });
      } else {
        // Burning state: < 1 hour remaining
        const progress = ((ONE_HOUR_MS - timeRemaining) / ONE_HOUR_MS) * 100;
        const opacity = Math.max(0.3, 1 - (progress / 100) * 0.7);
        setState({ burnState: 'burning', burnProgress: Math.min(100, progress), opacity });
      }
    };

    compute();
    const interval = setInterval(compute, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [expiresAt]);

  return state;
}
