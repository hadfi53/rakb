import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  className?: string;
}

export const RatingStars = ({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  className
}: RatingStarsProps) => {
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerSizes = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };

  const renderStar = (position: number) => {
    const isFilled = value >= position;
    const isPartiallyFilled = value > position - 1 && value < position;
    const fillPercentage = isPartiallyFilled ? ((value - (position - 1)) * 100) : 0;

    return (
      <button
        key={position}
        type="button"
        onClick={() => !readOnly && onChange(position)}
        className={cn(
          'text-yellow-400 transition-colors relative',
          !readOnly && 'hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-full',
          readOnly && 'cursor-default'
        )}
        disabled={readOnly}
      >
        <Star
          className={cn(
            starSizes[size],
            'absolute',
            isPartiallyFilled && 'text-yellow-400'
          )}
          style={{
            clipPath: isPartiallyFilled ? `inset(0 ${100 - fillPercentage}% 0 0)` : undefined
          }}
          fill="currentColor"
        />
        <Star
          className={starSizes[size]}
          fill={isFilled ? 'currentColor' : 'none'}
        />
      </button>
    );
  };

  return (
    <div
      className={cn(
        'flex items-center',
        containerSizes[size],
        className
      )}
    >
      {[1, 2, 3, 4, 5].map(renderStar)}
    </div>
  );
}; 