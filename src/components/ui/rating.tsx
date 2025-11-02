import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  defaultValue?: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({ value, defaultValue = 0, max = 5, onChange, readonly = false, className, ...props }, ref) => {
    const [rating, setRating] = React.useState(value ?? defaultValue);
    const [hoverRating, setHoverRating] = React.useState(0);

    React.useEffect(() => {
      if (value !== undefined) {
        setRating(value);
      }
    }, [value]);

    const handleStarClick = (index: number) => {
      if (readonly) return;
      const newRating = index + 1;
      setRating(newRating);
      onChange?.(newRating);
    };

    const handleStarHover = (index: number) => {
      if (readonly) return;
      setHoverRating(index + 1);
    };

    const handleMouseLeave = () => {
      if (readonly) return;
      setHoverRating(0);
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1", className)}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {[...Array(max)].map((_, index) => {
          const filled = index < (hoverRating || rating);
          return (
            <button
              key={index}
              type="button"
              className={cn(
                "relative transition-all duration-100",
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
                filled ? "text-yellow-400" : "text-gray-300"
              )}
              onClick={() => handleStarClick(index)}
              onMouseEnter={() => handleStarHover(index)}
              disabled={readonly}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-all duration-100",
                  filled && "fill-current"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }
);

Rating.displayName = "Rating"; 