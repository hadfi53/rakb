
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Insurance = () => {
  const coverages = [
    {
      title: "Responsabilité civile",
      description: "Couverture des dommages causés aux tiers"
    },
    {
      title: "Tous risques",
      description: "Protection complète du véhicule pendant la location"
    },
    {
      title: "Assistance 24/7",
      description: "Assistance routière disponible jour et nuit"
    },
    {
      title: "Protection conducteur",
      description: "Couverture des dommages corporels du conducteur"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Assurance et protection
            </h1>
            <p className="text-gray-600">
              Découvrez nos garanties pour des locations en toute sérénité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {coverages.map((coverage, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{coverage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{coverage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="prose max-w-none">
            <h2>Détails de la couverture</h2>
            <p>
              Notre assurance tous risques couvre :
            </p>
            <ul>
              <li>Dommages matériels</li>
              <li>Vol et tentative de vol</li>
              <li>Bris de glace</li>
              <li>Catastrophes naturelles</li>
              <li>Assistance routière</li>
            </ul>

            <h2>Franchise</h2>
            <p>
              Une franchise est appliquée en cas de sinistre. Son montant varie 
              selon le type de véhicule et peut être réduit en souscrivant à 
              notre option de rachat de franchise.
            </p>

            <h2>En cas de sinistre</h2>
            <p>
              En cas d'accident ou de sinistre, contactez immédiatement notre 
              service d'assistance disponible 24h/24 et 7j/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
