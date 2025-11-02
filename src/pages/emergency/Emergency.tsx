import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Phone, 
  AlertTriangle, 
  Car, 
  Shield, 
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  FileText
} from "lucide-react";
import { companyInfo, getPhoneLink } from "@/lib/config/company";

const Emergency = () => {
  const emergencyContacts = [
    {
      icon: Phone,
      title: "Assistance 24/7",
      description: "Service d'urgence disponible à tout moment",
      contact: companyInfo.phoneDisplay,
      available: companyInfo.businessHours.emergency,
      link: getPhoneLink()
    },
    {
      icon: Car,
      title: "Assistance routière",
      description: "En panne ou accident ? Nous intervenons rapidement",
      contact: companyInfo.phoneDisplay,
      available: "Intervention dans tout le Maroc",
      link: getPhoneLink()
    },
    {
      icon: MessageCircle,
      title: "Support en ligne",
      description: "Chat en direct avec notre équipe",
      contact: "Disponible sur la plateforme",
      available: "Du lundi au dimanche, 8h-22h"
    }
  ];

  const emergencySituations = [
    {
      icon: AlertTriangle,
      title: "Accident ou collision",
      steps: [
        "Restez calme et en sécurité",
        "Appelez immédiatement notre service d'urgence",
        "N'appelez les autorités si nécessaire (17 pour la police, 15 pour les secours)",
        "Remplissez un constat amiable avec l'autre partie si applicable",
        "Prenez des photos des dégâts et de la scène",
        "Ne quittez jamais les lieux sans autorisation"
      ]
    },
    {
      icon: Car,
      title: "Panne ou problème mécanique",
      steps: [
        "Garez le véhicule en sécurité si possible",
        "Contactez notre assistance routière immédiatement",
        "Allumez vos feux de détresse",
        "Placez le triangle de signalisation",
        "Attendez l'arrivée de l'assistance en sécurité",
        "Gardez vos documents de location à portée de main"
      ]
    },
    {
      icon: Shield,
      title: "Vol ou vandalisme",
      steps: [
        "Appelez immédiatement notre service d'urgence",
        "Déclarez l'incident à la police (commissariat ou 17)",
        "Obtenez un récépissé de plainte",
        "Prenez des photos si possible",
        "Contactez l'agence propriétaire du véhicule",
        "Conservez tous les documents pour votre dossier"
      ]
    },
    {
      icon: MapPin,
      title: "Véhicule volé ou perdu",
      steps: [
        "Contactez immédiatement notre service d'urgence",
        "Déclarez le vol à la police (commissariat ou 17)",
        "Obtenez un récépissé de plainte",
        "Fournissez tous les détails du véhicule",
        "Gardez une copie de tous les documents",
        "Restez en contact avec notre équipe"
      ]
    }
  ];

  const importantDocuments = [
    "Document de location",
    "Carte grise du véhicule",
    "Assurance du véhicule",
    "Permis de conduire",
    "Pièce d'identité",
    "Récépissé de police (si applicable)"
  ];

  return (
    <div className="min-h-screen bg-white pt-[106px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Service d'urgence RAKB
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Nous sommes là pour vous aider 24 heures sur 24, 7 jours sur 7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <a href={getPhoneLink()}>
                  <Phone className="mr-2" />
                  Appeler maintenant
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <MessageCircle className="mr-2" />
                  Contacter le support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Contacts d'urgence</h2>
            <p className="text-gray-600">
              Plusieurs canaux pour vous venir en aide rapidement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {emergencyContacts.map((contact, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <contact.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{contact.title}</CardTitle>
                  <p className="text-gray-600 text-sm mb-4">{contact.description}</p>
                </CardHeader>
                <CardContent>
                  {contact.link ? (
                    <a 
                      href={contact.link} 
                      className="font-semibold text-lg mb-2 block hover:text-primary transition-colors"
                    >
                      {contact.contact}
                    </a>
                  ) : (
                    <p className="font-semibold text-lg mb-2">{contact.contact}</p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" />
                    {contact.available}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Situations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Que faire en cas d'urgence ?</h2>
              <p className="text-gray-600">
                Guide étape par étape pour gérer différentes situations d'urgence
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {emergencySituations.map((situation, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <situation.icon className="w-6 h-6 text-red-600" />
                      </div>
                      <CardTitle className="text-xl">{situation.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {situation.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-700 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Documents importants à avoir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  En cas d'urgence, assurez-vous d'avoir accès à ces documents :
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {importantDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Conseil :</strong> Gardez une copie numérique de tous ces documents 
                    sur votre téléphone pour un accès rapide en cas de besoin.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Numbers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Numéros d'urgence nationaux</h2>
              <p className="text-gray-600">
                En cas de situation critique, contactez directement les services d'urgence
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">Police</h3>
                  <p className="text-2xl font-bold text-primary mb-2">19</p>
                  <p className="text-sm text-gray-600">Pour les urgences de sécurité</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">Secours</h3>
                  <p className="text-2xl font-bold text-primary mb-2">15</p>
                  <p className="text-sm text-gray-600">Pour les urgences médicales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">Pompiers</h3>
                  <p className="text-2xl font-bold text-primary mb-2">15</p>
                  <p className="text-sm text-gray-600">Pour les incendies</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Votre sécurité est notre priorité
            </h2>
            <p className="text-gray-700 mb-8">
              N'hésitez pas à nous contacter à tout moment. Notre équipe est formée 
              pour gérer toutes les situations d'urgence et vous aider rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <a href={getPhoneLink()}>
                  <Phone className="mr-2" />
                  Appeler maintenant
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/help">
                  <MessageCircle className="mr-2" />
                  Plus d'informations
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Emergency;

