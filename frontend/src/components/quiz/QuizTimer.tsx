'use client';

interface QuizTimerProps {
  timeRemaining: number | null;
  totalTime: number;
}

export default function QuizTimer({ timeRemaining, totalTime }: QuizTimerProps) {
  if (timeRemaining === null) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-sm text-gray-500">Practice Mode - No Timer</span>
      </div>
    );
  }

  const percentage = (timeRemaining / totalTime) * 100;
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - percentage / 100)}`}
            className={`transition-all ${isLowTime ? 'text-red-500' : 'text-primary'}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${isLowTime ? 'text-red-500' : 'text-gray-900'}`}>
            {timeRemaining}
          </span>
        </div>
      </div>
    </div>
  );
}

