import React from 'react';
import { classNames } from '../../utils/helpers';
import { FieldError } from '../common';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={classNames(
          'input w-full',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      <FieldError error={error} />
    </div>
  );
};

