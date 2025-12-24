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
    <div className="card p-6 max-w-2xl mx-auto bg-white shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
          سوال {question.questionNumber} از {question.totalQuestions}
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-900 text-right leading-relaxed">
        {question.questionText}
      </h2>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const optionLabels = ['الف', 'ب', 'ج', 'د', 'ه', 'و'];
          const optionLabel = optionLabels[option.order - 1] || option.order;

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onSelectOption(option.id)}
              disabled={disabled}
              className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-blue-600 min-w-[30px]">{optionLabel})</span>
                <span className="flex-1 text-gray-800">{option.text}</span>
                {isSelected && (
                  <span className="text-blue-600 text-xl">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

