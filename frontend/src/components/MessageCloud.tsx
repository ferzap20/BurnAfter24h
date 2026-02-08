import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message } from '../types';
import { MessageCard } from './MessageCard';
import { MessageModal } from './MessageModal';

interface MessageCloudProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onReport: (id: string) => void;
}

/** Fibonacci sphere: evenly distributes N points on a sphere surface. */
function fibonacciSphere(count: number) {
  const points: { theta: number; phi: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // range [1, -1]
    const theta = goldenAngle * i;
    const phi = Math.acos(y);

    points.push({
      theta,
      phi,
    });
  }
  return points;
}

/** Rotate a 3D point by angles around X and Y axes. */
function rotatePoint(
  x: number,
  y: number,
  z: number,
  rotX: number,
  rotY: number
): [number, number, number] {
  // Rotate around Y axis
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // Rotate around X axis
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y1, z2];
}

export function MessageCloud({ messages, loading, error, lastUpdated, onReport }: MessageCloudProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [rotation, setRotation] = useState({ x: -0.3, y: 0 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Sphere radius based on card count — bigger sphere for more cards
  const radius = Math.max(280, 180 + messages.length * 12);

  // Auto-rotation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (autoRotateRef.current && !isDragging.current) {
        setRotation((prev) => ({
          ...prev,
          y: prev.y + 0.15 * delta,
        }));
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Mouse/touch drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    autoRotateRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + dy * 0.004)),
      y: prev.y + dx * 0.004,
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    // Resume auto-rotation after a short pause
    setTimeout(() => {
      if (!isDragging.current) {
        autoRotateRef.current = true;
      }
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-smoke-200">
        <div className="text-4xl mb-3 animate-pulse">🔥</div>
        <p>Loading the burn cloud...</p>
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

  // Calculate sphere positions
  const points = messages.length > 1 ? fibonacciSphere(messages.length) : [{ theta: 0, phi: Math.PI / 2 }];

  const cards = messages.map((msg, i) => {
    const { theta, phi } = points[i];

    // Spherical to cartesian
    const rawX = radius * Math.sin(phi) * Math.cos(theta);
    const rawY = radius * Math.cos(phi);
    const rawZ = radius * Math.sin(phi) * Math.sin(theta);

    // Apply rotation
    const [x, y, z] = rotatePoint(rawX, rawY, rawZ, rotation.x, rotation.y);

    // Depth factor: z ranges from -radius to +radius, map to 0..1
    const depthFactor = (z + radius) / (2 * radius); // 0 = far back, 1 = front
    const scale = 0.5 + depthFactor * 0.5; // 0.5 to 1.0
    const opacity = 0.15 + depthFactor * 0.85; // 0.15 to 1.0
    const zIndex = Math.round(depthFactor * 1000);
    const isFront = depthFactor > 0.4;

    return (
      <div
        key={msg._id}
        className="sphere-card"
        style={{
          transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
          opacity,
          zIndex,
          pointerEvents: isFront ? 'auto' : 'none',
        }}
      >
        <MessageCard message={msg} onClick={setSelectedMessage} onReport={onReport} />
      </div>
    );
  });

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

      {/* 3D Sphere */}
      {messages.length > 0 && (
        <div className="sphere-viewport">
          <p className="text-xs text-smoke-400 text-center mb-2 select-none">
            Drag to rotate
          </p>
          <div
            ref={containerRef}
            className="sphere-container"
            style={{ height: `${radius * 2 + 120}px` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="sphere-scene" style={{ perspective: `${radius * 3}px` }}>
              <div className="sphere-rotator" style={{ transformStyle: 'preserve-3d' }}>
                {cards}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message modal */}
      {selectedMessage && (
        <MessageModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onReport={onReport}
        />
      )}
    </>
  );
}
