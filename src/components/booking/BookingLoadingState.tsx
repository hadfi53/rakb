import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface BookingLoadingStateProps {
  message?: string;
  subMessage?: string;
}

const BookingLoadingState = ({ 
  message = "Traitement en cours...",
  subMessage 
}: BookingLoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <Loader2 className="w-12 h-12 text-primary" />
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-medium text-gray-900 mb-2"
      >
        {message}
      </motion.p>
      
      {subMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 text-center max-w-sm"
        >
          {subMessage}
        </motion.p>
      )}
      
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BookingLoadingState;
