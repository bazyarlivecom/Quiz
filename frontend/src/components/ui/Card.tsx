import React from 'react';
import { classNames } from '../../utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  className,
  ...props
}) => {
  return (
    <div className={classNames('card', className)} {...props}>
      {(title || description) && (
        <div className="p-6 pb-0">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
      <div className={title || description ? 'p-6 pt-4' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

