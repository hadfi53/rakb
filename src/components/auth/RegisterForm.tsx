
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Car, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";
import { SocialLoginButtons } from "./SocialLoginButtons";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "renter" as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
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
            role: formData.role,
          },
        },
      });
      
      if (success) {
        navigate('/auth/login');
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Prénom"
            className="pl-10"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Nom"
            className="pl-10"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="email"
          placeholder="Email"
          className="pl-10"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="password"
          placeholder="Mot de passe"
          className="pl-10"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="pl-10"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Je suis un</label>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Button
            type="button"
            variant={formData.role === "renter" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, role: "renter" })}
            className="w-full py-2 md:py-3 text-sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Locataire
          </Button>
          <Button
            type="button"
            variant={formData.role === "owner" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, role: "owner" })}
            className="w-full py-2 md:py-3 text-sm"
          >
            <Car className="w-4 h-4 mr-2" />
            Propriétaire
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          required
        />
        <label htmlFor="terms" className="text-xs md:text-sm text-gray-600">
          J'accepte les{" "}
          <a href="/legal" className="text-primary hover:text-primary-dark underline">
            Conditions d'utilisation
          </a>{" "}
          et la{" "}
          <a href="/legal/privacy" className="text-primary hover:text-primary-dark underline">
            Politique de confidentialité
          </a>
        </label>
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading || !agreeToTerms} 
        className="w-full py-5 md:py-6 text-sm md:text-base font-semibold"
      >
        {isLoading ? "Inscription en cours..." : "Créer mon compte"}
      </Button>
      
      <SocialLoginButtons />
    </form>
  );
};
