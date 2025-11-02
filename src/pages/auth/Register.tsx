import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Car, User } from 'lucide-react';

interface LocationState {
  defaultRole?: 'owner' | 'renter';
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultRole } = (location.state as LocationState) || {};
  const { signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: defaultRole || 'renter'
  });

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger vers la page appropriée
    if (user) {
      if (formData.role === 'owner') {
        navigate('/dashboard/owner');
      } else {
        navigate('/dashboard/renter');
      }
    }
  }, [user, navigate, formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
          }
        }
      });

      if (success) {
        toast.success('Inscription réussie ! Un email de confirmation vous a été envoyé.');
        // Guider vers la vérification des documents selon le rôle choisi
        navigate('/documents/verification', { state: { role: formData.role } });
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Inscription</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 mb-6">
            <Label>Je souhaite m'inscrire en tant que</Label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:border-primary transition-colors ${
                  formData.role === 'renter' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="renter"
                  checked={formData.role === 'renter'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'renter' | 'owner' })}
                  className="sr-only"
                />
                <User className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Locataire</span>
              </label>
              
              <label
                className={`relative flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:border-primary transition-colors ${
                  formData.role === 'owner' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'renter' | 'owner' })}
                  className="sr-only"
                />
                <Car className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Agence de location</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              placeholder="Entrez votre prénom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              placeholder="Entrez votre nom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="exemple@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Confirmez votre mot de passe"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Déjà inscrit ?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </Button>
          </p>
        </form>
      </div>
    </div>
  );
}
