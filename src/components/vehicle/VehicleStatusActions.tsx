import { Button } from "@/components/ui/button";
import { VehiclePublicationStatus } from "@/types/vehicle";
import { Play, Pause, Archive, Edit, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VehicleStatusActionsProps {
  currentStatus: VehiclePublicationStatus;
  onStatusChange: (newStatus: VehiclePublicationStatus) => Promise<void>;
  onEdit?: () => void;
  onPreview?: () => void;
}

export const VehicleStatusActions = ({
  currentStatus,
  onStatusChange,
  onEdit,
  onPreview
}: VehicleStatusActionsProps) => {
  const canPause = currentStatus === 'active';
  const canActivate = currentStatus === 'paused';
  const canArchive = currentStatus === 'active' || currentStatus === 'paused';

  return (
    <div className="flex items-center gap-2">
      {onPreview && (
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Prévisualiser
        </Button>
      )}
      
      {onEdit && currentStatus !== 'active' && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      )}

      {canPause && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Mettre en pause
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mettre en pause</AlertDialogTitle>
              <AlertDialogDescription>
                Votre véhicule ne sera plus visible dans les résultats de recherche. 
                Vous pourrez le réactiver à tout moment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStatusChange('paused')}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canActivate && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Réactiver
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réactiver le véhicule</AlertDialogTitle>
              <AlertDialogDescription>
                Votre véhicule sera à nouveau visible dans les résultats de recherche.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStatusChange('active')}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canArchive && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Archiver
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archiver le véhicule</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le véhicule sera définitivement archivé 
                et ne pourra plus être utilisé pour de nouvelles réservations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStatusChange('archived')}>
                Confirmer l'archivage
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

