import { AlertCircle, HelpCircle, RefreshCw, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface BookingErrorMessageProps {
  title: string;
  message: string;
  suggestions?: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: "error" | "warning" | "info";
}

const BookingErrorMessage = ({
  title,
  message,
  suggestions = [],
  onRetry,
  onDismiss,
  type = "error"
}: BookingErrorMessageProps) => {
  const iconMap = {
    error: AlertCircle,
    warning: AlertCircle,
    info: HelpCircle
  };

  const colorMap = {
    error: "destructive",
    warning: "default",
    info: "default"
  };

  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full"
    >
      <Alert variant={colorMap[type] as any}>
        <Icon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{message}</p>
          
          {suggestions.length > 0 && (
            <Card className="mt-4 border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Suggestions :
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2 mt-4">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Fermer
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

export default BookingErrorMessage;
