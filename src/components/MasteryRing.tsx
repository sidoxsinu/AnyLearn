'use client';

interface MasteryRingProps {
  probability: number;   // 0..1
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function MasteryRing({ probability, size = 48, strokeWidth = 4, label }: MasteryRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * Math.min(1, Math.max(0, probability));

  const color =
    probability === 0 ? 'var(--mastery-untouched)' :
    probability < 0.5 ? 'var(--mastery-weak)' :
    probability < 0.8 ? 'var(--mastery-ok)' :
    'var(--mastery-solid)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--bg-4)"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1), stroke 300ms ease' }}
      />
      {/* Center text */}
      {label !== undefined ? (
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.24}
          fill={color}
          fontFamily="Inter, sans-serif"
          fontWeight={700}
        >
          {label}
        </text>
      ) : (
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.24}
          fill={color}
          fontFamily="Inter, sans-serif"
          fontWeight={700}
        >
          {Math.round(probability * 100)}%
        </text>
      )}
    </svg>
  );
}

interface MasteryBarProps {
  probability: number;
  conceptName?: string;
}

export function MasteryBar({ probability, conceptName }: MasteryBarProps) {
  const color =
    probability === 0 ? 'var(--mastery-untouched)' :
    probability < 0.5 ? 'var(--mastery-weak)' :
    probability < 0.8 ? 'var(--mastery-ok)' :
    'var(--mastery-solid)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {conceptName && (
        <div className="text-sm truncate" style={{ width: 160, flexShrink: 0 }}>{conceptName}</div>
      )}
      <div className="mastery-bar-track" style={{ flex: 1 }}>
        <div
          className="mastery-bar-fill"
          style={{ width: `${probability * 100}%`, background: color }}
        />
      </div>
      <div className="text-xs text-muted" style={{ width: 36, textAlign: 'right', flexShrink: 0 }}>
        {Math.round(probability * 100)}%
      </div>
    </div>
  );
}
