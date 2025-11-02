import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Trash2,
  LogOut,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/Navbar";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user, getUserRole } = useAuth();
  const { getProfile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await getUserRole();
        setCurrentRole(role);
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, [getUserRole]);

  const handleDeleteAccount = async () => {
    // Implémenter la logique de suppression du compte
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
    );

    if (confirmed) {
      try {
        setLoading(true);
        // Ajouter la logique de suppression ici
        toast({
          title: "Compte supprimé",
          description: "Votre compte a été supprimé avec succès",
        });
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer votre compte",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vous déconnecter",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Autres sections de paramètres */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles et vos préférences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Apparence */}
                <Card>
                  <CardHeader>
                    <CardTitle>Apparence</CardTitle>
                    <CardDescription>
                      Personnalisez l'apparence de l'application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Thème sombre</Label>
                        <p className="text-sm text-gray-500">
                          Basculer entre le thème clair et sombre
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                      >
                        {theme === 'dark' ? (
                          <Sun className="h-5 w-5" />
                        ) : (
                          <Moon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      Gérez vos préférences de notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notifications par email</Label>
                        <p className="text-sm text-gray-500">
                          Recevoir des mises à jour par email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notifications push</Label>
                        <p className="text-sm text-gray-500">
                          Recevoir des notifications sur votre appareil
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notifications marketing</Label>
                        <p className="text-sm text-gray-500">
                          Recevoir des offres et promotions
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Langue */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Langue
                    </CardTitle>
                    <CardDescription>
                      Choisissez votre langue préférée
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <select
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700"
                      defaultValue="fr"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </CardContent>
                </Card>

                {/* Sécurité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Sécurité
                    </CardTitle>
                    <CardDescription>
                      Gérez la sécurité de votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/auth/change-password')}
                    >
                      Changer le mot de passe
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/documents/verification')}
                    >
                      Vérification d'identité
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          <div>
            {/* Sidebar avec informations supplémentaires */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">ID utilisateur</p>
                    <p className="text-sm text-muted-foreground break-all">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rôle</p>
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? "Chargement..." : 
                       currentRole === 'owner' ? 'Propriétaire' : 
                       currentRole === 'renter' ? 'Locataire' : 
                       currentRole === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions de compte */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Actions dangereuses
            </CardTitle>
            <CardDescription>
              Ces actions sont irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 dark:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {loading ? 'Suppression...' : 'Supprimer le compte'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 