
import { Shield, CheckCircle, Phone, AlertTriangle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { companyInfo, getPhoneLink } from "@/lib/config/company";

const Insurance = () => {
  const coverages = [
    {
      title: "Responsabilité civile",
      description: "Couverture complète des dommages causés aux tiers jusqu'à 20 millions de DH",
      details: "Protection financière en cas d'accident responsable"
    },
    {
      title: "Assurance tous risques",
      description: "Protection complète du véhicule pendant toute la durée de la location",
      details: "Couverture des dommages matériels, vol, incendie et bris de glace"
    },
    {
      title: "Assistance routière 24/7",
      description: "Service d'assistance disponible jour et nuit dans tout le Maroc",
      details: "Dépannage, remorquage et véhicule de remplacement si nécessaire"
    },
    {
      title: "Protection conducteur",
      description: "Couverture des dommages corporels du conducteur et des passagers",
      details: "Assurance individuelle accident jusqu'à 500 000 DH"
    }
  ];

  const coverageDetails = [
    "Dommages matériels au véhicule",
    "Vol et tentative de vol",
    "Bris de glace (pare-brise, vitres)",
    "Catastrophes naturelles (inondations, tempêtes)",
    "Incendie et explosion",
    "Collision avec un animal",
    "Vandalisme et actes de malveillance",
    "Assistance routière 24h/24"
  ];

  const exclusions = [
    "Conduite en état d'ivresse",
    "Conduite sans permis valide",
    "Utilisation du véhicule à des fins commerciales non autorisées",
    "Dommages causés volontairement",
    "Utilisation hors du territoire marocain sans autorisation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 mx-auto text-primary mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Assurance et protection
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une protection complète incluse dans chaque location pour votre tranquillité d'esprit
            </p>
          </div>

          {/* Coverage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {coverages.map((coverage, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{coverage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3 font-medium">{coverage.description}</p>
                  <p className="text-gray-600 text-sm">{coverage.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coverage Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                Détails de la couverture tous risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Notre assurance tous risques couvre les situations suivantes :
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {coverageDetails.map((detail, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Franchise Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Franchise et garanties</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                Une franchise est appliquée en cas de sinistre. Le montant varie selon le type de véhicule :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Véhicules économiques :</strong> Franchise de 2 000 à 3 000 DH</li>
                <li><strong>Véhicules standards :</strong> Franchise de 3 000 à 5 000 DH</li>
                <li><strong>Véhicules premium :</strong> Franchise de 5 000 à 10 000 DH</li>
                <li><strong>Véhicules de luxe :</strong> Franchise de 10 000 à 20 000 DH</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Option rachat de franchise :</strong> Vous pouvez réduire votre franchise 
                en souscrivant à notre option de rachat, disponible lors de la réservation.
              </p>
            </CardContent>
          </Card>

          {/* Exclusions */}
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="w-6 h-6" />
                Exclusions importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Les situations suivantes ne sont pas couvertes par l'assurance :
              </p>
              <ul className="space-y-2">
                {exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">×</span>
                    <span className="text-gray-700">{exclusion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* In Case of Accident */}
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Phone className="w-6 h-6" />
                En cas de sinistre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                En cas d'accident ou de sinistre, suivez ces étapes :
              </p>
              <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                <li>Restez calme et sécurisez les lieux</li>
                <li>Contactez immédiatement notre service d'assistance 24/7</li>
                <li>Remplissez un constat amiable si possible</li>
                <li>Prenez des photos des dégâts et de la scène</li>
                <li>Ne quittez jamais les lieux sans autorisation</li>
                <li>Conservez tous les documents pour votre dossier</li>
              </ol>
              <div className="mt-6">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                  <a href={getPhoneLink()}>
                    <Phone className="mr-2" />
                    Appeler l'assistance : {companyInfo.phoneDisplay}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Documents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Documents importants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                En cas de sinistre, assurez-vous d'avoir ces documents :
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Contrat de location</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Carte grise du véhicule</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Permis de conduire</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Pièce d'identité</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Constat amiable (si applicable)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Besoin d'aide ?</h2>
            <p className="text-gray-600 mb-6">
              Notre équipe est disponible 24/7 pour répondre à vos questions sur l'assurance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/emergency">
                  Service d'urgence
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/contact">
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
