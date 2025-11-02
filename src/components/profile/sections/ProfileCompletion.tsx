
import { Progress } from "@/components/ui/progress";

interface ProfileCompletionProps {
  completion: number;
  missingItems?: string[];
}

export const ProfileCompletion = ({ completion, missingItems }: ProfileCompletionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Complétion du profil</span>
          <span>{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />
      </div>
      {missingItems && missingItems.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Pour compléter votre profil :</p>
          <ul className="list-disc list-inside mt-1">
            {missingItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
