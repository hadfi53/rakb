import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockProfileApi, MockProfile, MockDocument } from '@/lib/mock-profile-data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Bell,
  Car,
  CheckCircle,
  AlertCircle,
  Key,
  FileText,
  Lock,
  Upload,
  Plus,
} from 'lucide-react';
import { UserProfile, UserRole, Address, DocumentType } from '@/types/user';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExtendedAddress extends Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
}

interface UserDocuments {
  identity?: boolean;
  driver_license?: boolean;
  proof_of_address?: boolean;
}

interface ProfileState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  address?: ExtendedAddress;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  birthdate?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
}

interface ProfileInputEvent extends React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {
  target: HTMLInputElement | HTMLTextAreaElement & {
    name: keyof ProfileState | keyof ExtendedAddress;
    value: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { 
    getProfile, 
    checkDocuments, 
    documents, 
    loading: profileLoading, 
    uploading, 
    setUploading,
    handleDocumentUpload
  } = useProfile();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'renter',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'MA'
    },
    notification_preferences: {
      email: true,
      push: true
    },
    email_verified: false,
    phone_verified: false,
    birthdate: ''
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string | null>(null);

  // Conversion des documents en objet
  const documentStatus: UserDocuments = documents.reduce((acc, doc) => ({
    ...acc,
    [doc.document_type]: true
  }), {});

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (data) {
          setProfile(prev => ({
            ...prev,
            ...data,
            // Ensure no null values in address
            address: {
              street: data.address?.street ?? '',
              city: data.address?.city ?? '',
              postal_code: data.address?.postal_code ?? '',
              country: data.address?.country ?? 'MA'
            },
            // Ensure no null values in notification preferences
            notification_preferences: {
              email: data.notification_preferences?.email ?? true,
              push: data.notification_preferences?.push ?? true
            },
            // Ensure other fields are not null
            first_name: data.first_name ?? '',
            last_name: data.last_name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            birthdate: data.birthdate ?? ''
          }));
        }
      } catch (err) {
        setError('Erreur lors du chargement du profil');
        console.error('Error loading profile:', err);
      }
    };
    
    if (user) {
      loadProfile();
    }
  }, [user, getProfile]);

  // Effet séparé pour charger les documents
  useEffect(() => {
    if (user) {
      checkDocuments();
    }
  }, [user]);

  const updateProfile = async () => {
    try {
      setIsSubmitting(true);
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté pour mettre à jour votre profil",
        });
        return;
      }

      // Mise à jour du profil avec mock data
      await mockProfileApi.updateProfile(user.id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        birthdate: profile.birthdate,
        address: profile.address,
        notification_preferences: profile.notification_preferences
      });

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileChange = (e: ProfileInputEvent | Partial<ProfileState>) => {
    if ('target' in e) {
      const { name, value } = e.target;
      setProfile(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        ...e,
      }));
    }
  };

  const handleAddressChange = (e: ProfileInputEvent) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [name]: value,
      } as ExtendedAddress,
    }));
  };

  const handleNotificationChange = (type: keyof NotificationPreferences) => (checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [type]: checked,
      },
    }));
  };

  const handleFileUpload = async (type: DocumentType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucun fichier sélectionné",
      });
      return;
    }

    // Utiliser la fonction du hook
    await handleDocumentUpload(type, file);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              {profile.first_name || profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : "Complétez votre profil"
              }
            </h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Membre depuis {format(new Date(user?.created_at || ''), 'MMMM yyyy', { locale: fr })}</span>
            </div>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge variant={profile.email_verified ? "default" : "outline"}>
            {profile.email_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            Email vérifié
          </Badge>
          <Badge variant={profile.phone_verified ? "default" : "outline"}>
            {profile.phone_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            Téléphone vérifié
          </Badge>
          {documentStatus.identity && (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3" />
              Identité vérifiée
            </Badge>
          )}
          {documentStatus.driver_license && (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3" />
              Permis vérifié
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Bell className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>Vos informations personnelles principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleProfileChange}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleProfileChange}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="votre@email.com"
                      disabled
                    />
                    {profile.email_verified && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="06XXXXXXXX"
                    />
                    {profile.phone_verified && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date de naissance</Label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={profile.birthdate}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresse</CardTitle>
              <CardDescription>Votre adresse de résidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Rue</Label>
                  <Input
                    id="street"
                    name="street"
                    value={profile.address?.street}
                    onChange={handleAddressChange}
                    placeholder="Numéro et nom de rue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    name="city"
                    value={profile.address?.city}
                    onChange={handleAddressChange}
                    placeholder="Votre ville"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={profile.address?.postal_code}
                    onChange={handleAddressChange}
                    placeholder="Code postal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>Gérez la sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Mot de passe</p>
                    <p className="text-sm text-muted-foreground">Dernière modification il y a 3 mois</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Key className="h-4 w-4" />
                    Modifier
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">Sécurisez davantage votre compte</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Activer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents d'identité</CardTitle>
              <CardDescription>Vérifiez votre identité pour plus de confiance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Carte d'identité</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentStatus.identity ? "Document vérifié" : "Ajoutez votre carte d'identité"}
                    </p>
                  </div>
                  <label htmlFor="identity-upload">
                    <input
                      id="identity-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileUpload('identity', e)}
                      disabled={uploading}
                    />
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        {uploading ? "Téléversement..." : documentStatus.identity ? "Mettre à jour" : "Ajouter"}
                      </span>
                    </Button>
                  </label>
                </div>
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Permis de conduire</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentStatus.driver_license ? "Document vérifié" : "Ajoutez votre permis de conduire"}
                    </p>
                  </div>
                  <label htmlFor="driving-license-upload">
                    <input
                      id="driving-license-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileUpload('driver_license', e)}
                      disabled={uploading}
                    />
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        {uploading ? "Téléversement..." : documentStatus.driver_license ? "Mettre à jour" : "Ajouter"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Gérez vos préférences de notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">Recevez des mises à jour par email</p>
                  </div>
                  <Switch
                    checked={profile.notification_preferences.email}
                    onCheckedChange={handleNotificationChange('email')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-muted-foreground">Recevez des notifications sur votre appareil</p>
                  </div>
                  <Switch
                    checked={profile.notification_preferences.push}
                    onCheckedChange={handleNotificationChange('push')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={updateProfile} 
          className="h-12 px-6 gap-2 rounded-full shadow-lg"
          disabled={isSubmitting}
        >
          <Plus className="h-4 w-4" />
          {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
