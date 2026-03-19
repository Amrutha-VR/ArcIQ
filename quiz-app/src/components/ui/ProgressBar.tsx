import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  value: number;       // 0-100
  className?: string;
  color?: 'indigo' | 'green' | 'red' | 'yellow';
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  value,
  className,
  color = 'indigo',
  showLabel,
  animated,
}: ProgressBarProps) {
  const colors = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colors[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}