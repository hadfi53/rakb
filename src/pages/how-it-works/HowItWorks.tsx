
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  Shield, 
  MapPin,
  Star,
  Phone
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      title: "Recherchez votre véhicule",
      description: "Utilisez nos filtres pour trouver la voiture parfaite selon vos critères",
      icon: Car,
    },
    {
      title: "Choisissez le lieu de prise en charge",
      description: "À l'aéroport, en ville ou livraison à domicile",
      icon: MapPin,
    },
    {
      title: "Réservez en quelques clics",
      description: "Processus simple et sécurisé avec confirmation instantanée",
      icon: Check,
    },
    {
      title: "Profitez de votre location",
      description: "Rencontrez votre hôte et partez à l'aventure",
      icon: Star,
    }
  ];

  const advantages = [
    {
      title: "Service à l'aéroport",
      description: "Récupération simple et rapide directement à l'aéroport",
      icon: Clock,
    },
    {
      title: "Hôtes locaux",
      description: "Bénéficiez de conseils personnalisés de propriétaires marocains",
      icon: Phone,
    },
    {
      title: "Protection complète",
      description: "Assistance routière 24/7 et assurance incluse",
      icon: Shield,
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 to-white pt-16 pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Louez la voiture idéale en toute simplicité partout au Maroc
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Découvrez une nouvelle façon de louer des véhicules, 
              connectant les locataires avec des agences professionnelles vérifiées
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/auth/register">
                  Commencer maintenant
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 -mt-16">
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center mb-6">
              Pourquoi choisir Rakeb ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Caractéristiques</TableHead>
                  <TableHead className="w-1/3 text-primary">Rakeb</TableHead>
                  <TableHead className="w-1/3">Agences traditionnelles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Processus de réservation</TableCell>
                  <TableCell className="text-primary">
                    <div className="flex items-center gap-2">
                      <Check className="text-primary w-5 h-5" />
                      100% en ligne, simple et rapide
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-5 h-5" />
                      Paperasse et attente en agence
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Points de prise en charge</TableCell>
                  <TableCell className="text-primary">
                    <div className="flex items-center gap-2">
                      <Check className="text-primary w-5 h-5" />
                      Flexible, livraison possible
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-5 h-5" />
                      Uniquement en agence
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Choix de véhicules</TableCell>
                  <TableCell className="text-primary">
                    <div className="flex items-center gap-2">
                      <Check className="text-primary w-5 h-5" />
                      Large choix de véhicules locaux
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-5 h-5" />
                      Choix limité
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Évaluations</TableCell>
                  <TableCell className="text-primary">
                    <div className="flex items-center gap-2">
                      <Check className="text-primary w-5 h-5" />
                      Avis détaillés des utilisateurs
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-5 h-5" />
                      Pas de système d'évaluation
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Steps Section */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Comment louer une voiture avec Rakeb ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <CardHeader className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-center">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Advantages Section */}
      <div className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Les avantages Rakeb
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <advantage.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-8" />
            <h2 className="text-3xl font-bold mb-6">
              Sécurité et protection garanties
            </h2>
            <div className="prose max-w-none">
              <ul className="list-none p-0 space-y-4">
                <li className="flex items-center justify-center gap-2">
                  <Check className="text-primary flex-shrink-0" />
                  <span>Assurance tous risques incluse pour chaque location</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <Check className="text-primary flex-shrink-0" />
                  <span>Assistance routière disponible 24h/24 et 7j/7</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <Check className="text-primary flex-shrink-0" />
                  <span>Vérification d'identité pour plus de sécurité</span>
                </li>
              </ul>
            </div>
            <div className="mt-12">
              <Button asChild size="lg">
                <Link to="/auth/register">
                  Rejoignez Rakeb maintenant
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
