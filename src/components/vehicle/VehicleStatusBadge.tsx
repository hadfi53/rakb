import { Badge } from "@/components/ui/badge";
import { VehiclePublicationStatus } from "@/types/vehicle";
import { Clock, CheckCircle2, Pause, Archive, XCircle, FileText } from "lucide-react";

interface VehicleStatusBadgeProps {
  status: VehiclePublicationStatus;
  className?: string;
}

export const VehicleStatusBadge = ({ status, className = "" }: VehicleStatusBadgeProps) => {
  const statusConfig = {
    draft: {
      label: "Brouillon",
      variant: "secondary" as const,
      icon: FileText,
      className: "bg-gray-100 text-gray-700 border-gray-300"
    },
    pending_review: {
      label: "En attente de modération",
      variant: "default" as const,
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700 border-yellow-300"
    },
    active: {
      label: "Actif",
      variant: "default" as const,
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-300"
    },
    paused: {
      label: "En pause",
      variant: "secondary" as const,
      icon: Pause,
      className: "bg-blue-100 text-blue-700 border-blue-300"
    },
    archived: {
      label: "Archivé",
      variant: "secondary" as const,
      icon: Archive,
      className: "bg-gray-100 text-gray-700 border-gray-300"
    },
    rejected: {
      label: "Rejeté",
      variant: "destructive" as const,
      icon: XCircle,
      className: "bg-red-100 text-red-700 border-red-300"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

