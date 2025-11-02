import { useState } from 'react';
import { UserCircle, Camera } from 'lucide-react';

interface AvatarSectionProps {
  avatarUrl?: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AvatarSection = ({ avatarUrl, uploading, onUpload }: AvatarSectionProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.warn("Erreur de chargement de l'avatar:", avatarUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary bg-muted">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-5 h-5 text-white" />
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};
