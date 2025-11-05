
import { Shield, Lock, Eye, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  const collectedData = [
    {
      category: "Données d'identification",
      items: [
        "Nom et prénom",
        "Adresse email",
        "Numéro de téléphone",
        "Date de naissance",
        "Pièce d'identité (CNIE ou passeport)"
      ]
    },
    {
      category: "Données de paiement",
      items: [
        "Informations de carte bancaire (stockées de manière sécurisée)",
        "Historique des transactions",
        "Adresse de facturation"
      ]
    },
    {
      category: "Données de location",
      items: [
        "Historique des réservations",
        "Préférences de véhicules",
        "Evaluations et commentaires"
      ]
    },
    {
      category: "Données techniques",
      items: [
        "Adresse IP",
        "Type de navigateur",
        "Données de connexion",
        "Cookies et technologies similaires"
      ]
    }
  ];

  const usagePurposes = [
    "Gestion de votre compte et authentification",
    "Traitement et traitement des réservations",
    "Communication avec les agences et locataires",
    "Amélioration de nos services et expérience utilisateur",
    "Envoi de notifications importantes",
    "Analyse statistique et recherche",
    "Prévention de la fraude et sécurité",
    "Conformité aux obligations légales"
  ];

  const securityMeasures = [
    "Chiffrement SSL/TLS pour toutes les transmissions",
    "Stockage sécurisé des données avec chiffrement",
    "Authentification à deux facteurs disponible",
    "Contrôle d'accès strict aux données personnelles",
    "Audits de sécurité réguliers",
    "Sauvegarde régulière des données",
    "Formation continue de notre équipe sur la protection des données"
  ];

  const userRights = [
    {
      right: "Droit d'accès",
      description: "Vous pouvez demander une copie de toutes vos données personnelles."
    },
    {
      right: "Droit de rectification",
      description: "Vous pouvez corriger vos données incorrectes ou incomplètes."
    },
    {
      right: "Droit à l'effacement",
      description: "Vous pouvez demander la suppression de vos données sous certaines conditions."
    },
    {
      right: "Droit à la portabilité",
      description: "Vous pouvez obtenir vos données dans un format structuré."
    },
    {
      right: "Droit d'opposition",
      description: "Vous pouvez vous opposer au traitement de vos données pour certaines finalités."
    },
    {
      right: "Droit à la limitation",
      description: "Vous pouvez demander la limitation du traitement de vos données."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 mx-auto text-primary mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comment nous protégeons et utilisons vos données personnelles
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Dernière mise à jour : Mars 2024
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed">
                Chez RAKB, la protection de vos données personnelles est une priorité absolue. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, 
                stockons et protégeons vos informations personnelles conformément au RGPD 
                (Règlement Général sur la Protection des Données) et à la législation marocaine.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                1. Collecte des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Nous collectons uniquement les données nécessaires au bon fonctionnement de nos services :
              </p>
              <div className="space-y-6">
                {collectedData.map((category, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-gray-900 mb-2">{category.category}</h3>
                    <ul className="space-y-1">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                2. Utilisation des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Vos données sont utilisées exclusivement pour les finalités suivantes :
              </p>
              <ul className="space-y-2">
                {usagePurposes.map((purpose, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{purpose}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                3. Protection des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                appropriées pour protéger vos données :
              </p>
              <ul className="space-y-2">
                {securityMeasures.map((measure, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{measure}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-primary" />
                4. Partage des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Avec les agences de location :</strong> Pour faciliter les réservations et la communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Avec nos prestataires de services :</strong> Pour le traitement des paiements, l'hébergement et l'assistance technique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Obligations légales :</strong> Si requis par la loi ou les autorités compétentes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                5. Vos droits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Conformément au RGPD et à la législation marocaine, vous disposez des droits suivants :
              </p>
              <div className="space-y-4">
                {userRights.map((item, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.right}</h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <p className="text-gray-700">
                  <strong>Pour exercer vos droits :</strong> Contactez-nous à l'adresse email 
                  indiquée dans la section "Contact" avec votre demande. Nous répondrons 
                  dans un délai maximum de 30 jours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Cookies et technologies similaires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez 
                gérer vos préférences de cookies dans les paramètres de votre navigateur. 
                Pour plus d'informations, consultez notre politique de cookies.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact et questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant cette politique de confidentialité ou 
                pour exercer vos droits, contactez-nous :
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline">
                  <Link to="/contact">
                    Nous contacter
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/legal">
                    Mentions légales
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
