'use client';

import { Question } from '../../types/quiz.types';

interface QuestionCardProps {
  question: Question;
  onSelectOption: (optionId: number) => void;
  selectedOptionId: number | null;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  onSelectOption,
  selectedOptionId,
  disabled = false,
}: QuestionCardProps) {
  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {question.questionNumber} of {question.totalQuestions}
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const optionLabel = String.fromCharCode(64 + option.order);

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onSelectOption(option.id)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-primary/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="font-semibold mr-2">{optionLabel}.</span>
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

