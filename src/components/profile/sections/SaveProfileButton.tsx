
import { Button } from '@/components/ui/button';

interface SaveProfileButtonProps {
  onSave: () => void;
}

export const SaveProfileButton = ({ onSave }: SaveProfileButtonProps) => {
  return (
    <Button onClick={onSave} className="w-full">
      Sauvegarder les modifications
    </Button>
  );
};
