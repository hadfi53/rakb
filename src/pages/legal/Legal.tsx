
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Legal = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Informations légales</h1>
            <p className="text-gray-600">Tout ce que vous devez savoir sur les aspects légaux de RAKB</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conditions Générales d'Utilisation</CardTitle>
                <CardDescription>Dernière mise à jour : Mars 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose">
                <h3>1. Objet</h3>
                <p>
                  Les présentes Conditions Générales d'Utilisation définissent les modalités 
                  d'utilisation de la plateforme RAKB par les utilisateurs.
                </p>

                <h3>2. Services proposés</h3>
                <p>
                  RAKB est une plateforme de location de véhicules 
                  connectant les locataires avec des agences de location professionnelles vérifiées.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/legal/privacy">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Politique de confidentialité</CardTitle>
                    <CardDescription>
                      Comment nous protégeons vos données personnelles
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/legal/insurance">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Assurance et protection</CardTitle>
                    <CardDescription>
                      Découvrez nos garanties et couvertures d'assurance
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
