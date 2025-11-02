import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Car,
  Banknote,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  HeartHandshake,
  Settings2
} from "lucide-react";

export default function BeforeOwner() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/become-owner');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* En-tête */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Louez votre véhicule en toute sérénité</h1>
          <p className="text-xl text-muted-foreground">
            Rejoignez notre communauté de propriétaires et générez des revenus supplémentaires
          </p>
        </div>

        {/* Avantages principaux */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Banknote className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Revenus garantis</h3>
            <p className="text-muted-foreground">
              Gagnez jusqu'à 1500 Dh par semaine en louant votre véhicule
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Protection complète</h3>
            <p className="text-muted-foreground">
              Assurance tous risques et assistance 24/7 incluses
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <HeartHandshake className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Flexibilité totale</h3>
            <p className="text-muted-foreground">
              Vous gardez le contrôle sur vos disponibilités et vos tarifs
            </p>
          </Card>
        </div>

        {/* Comment ça marche */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Inscrivez votre véhicule</h3>
                  <p className="text-muted-foreground">
                    Ajoutez les photos et les informations de votre véhicule en quelques minutes
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">2. Gérez votre calendrier</h3>
                  <p className="text-muted-foreground">
                    Définissez vos disponibilités et vos tarifs selon vos préférences
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">3. Recevez des demandes</h3>
                  <p className="text-muted-foreground">
                    Les locataires vous contactent directement via la plateforme
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">4. Recevez vos paiements</h3>
                  <p className="text-muted-foreground">
                    Les paiements sont sécurisés et automatiquement versés sur votre compte
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <CardContent className="space-y-4">
                  <h3 className="text-xl font-semibold">Ce que nous offrons</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Assurance tous risques incluse</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Assistance routière 24/7</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Vérification des locataires</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Support client dédié</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Paiements sécurisés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Gestion simplifiée des réservations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="space-y-4">
                  <h3 className="text-xl font-semibold">Services supplémentaires</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-primary" />
                      <span>Service de nettoyage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Service de livraison du véhicule</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à commencer l'aventure ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Rejoignez notre communauté de propriétaires et commencez à générer des revenus dès aujourd'hui.
            </p>
          </div>
          <Button size="lg" onClick={handleContinue}>
            Devenir propriétaire
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 