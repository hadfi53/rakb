
import { Link } from "react-router-dom";
import { Shield, FileText, CheckCircle, AlertTriangle, Building2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/config/company";

const Legal = () => {
  const cguSections = [
    {
      title: "1. Objet et champ d'application",
      content: "Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités et conditions d'utilisation de la plateforme RAKB. En accédant et en utilisant notre plateforme, vous acceptez sans réserve ces conditions."
    },
    {
      title: "2. Services proposés",
      content: "RAKB est une plateforme de location de véhicules connectant les locataires avec des agences de location professionnelles vérifiées. Nous facilitons la mise en relation, la réservation et la gestion des locations de véhicules au Maroc."
    },
    {
      title: "3. Conditions d'utilisation",
      content: "Pour utiliser notre plateforme, vous devez être âgé d'au moins 18 ans et avoir la capacité légale de contracter. Vous vous engagez à fournir des informations exactes et à maintenir la sécurité de votre compte."
    },
    {
      title: "4. Responsabilités",
      content: "RAKB agit en tant qu'intermédiaire entre les locataires et les agences. Nous ne sommes pas responsables des dommages causés par les véhicules loués ou des litiges entre les parties. Chaque agence est responsable de ses propres véhicules et conditions."
    },
    {
      title: "5. Paiements et réservations",
      content: "Les paiements sont sécurisés et gérés par notre plateforme. Les réservations sont confirmées par email. Les conditions d'annulation et de remboursement varient selon les agences et sont indiquées lors de la réservation."
    },
    {
      title: "6. Propriété intellectuelle",
      content: "Tous les contenus de la plateforme (textes, images, logos) sont la propriété de RAKB ou de ses partenaires. Toute reproduction ou utilisation non autorisée est interdite."
    },
    {
      title: "7. Protection des données",
      content: "Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité et au RGPD. Nous nous engageons à protéger vos informations personnelles."
    },
    {
      title: "8. Modifications des CGU",
      content: "RAKB se réserve le droit de modifier ces CGU à tout moment. Les modifications seront notifiées aux utilisateurs et prendront effet dès leur publication sur la plateforme."
    },
    {
      title: "9. Droit applicable et juridiction",
      content: "Les présentes CGU sont régies par le droit marocain. Tout litige sera soumis à la compétence exclusive des tribunaux marocains."
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
              Informations légales
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce que vous devez savoir sur les aspects légaux de RAKB
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Dernière mise à jour : Mars 2024
            </p>
          </div>

          {/* Company Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Informations sur RAKB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Raison sociale</h3>
                  <p className="text-gray-700">{companyInfo.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Siège social</h3>
                  <p className="text-gray-700">
                    {companyInfo.address.city}, {companyInfo.address.country}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-700">{companyInfo.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Téléphone</h3>
                  <p className="text-gray-700">{companyInfo.phoneDisplay}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CGU */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Conditions Générales d'Utilisation
              </CardTitle>
              <CardDescription>Dernière mise à jour : Mars 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cguSections.map((section, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                      {section.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notices */}
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="w-6 h-6" />
                Avertissements importants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Vérification des documents :</strong> Tous les utilisateurs doivent 
                    fournir des documents valides. Les faux documents entraîneront une 
                    exclusion définitive de la plateforme.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Conduite responsable :</strong> Les utilisateurs s'engagent à 
                    conduire de manière responsable et respectueuse du code de la route.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Réservation :</strong> Toute réservation confirmée est engageante. 
                    Les annulations sont régies par les conditions spécifiques de chaque agence.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Related Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link to="/legal/privacy">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Politique de confidentialité
                  </CardTitle>
                  <CardDescription>
                    Comment nous protégeons vos données personnelles et respectons votre vie privée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Découvrez comment nous collectons, utilisons et protégeons vos informations personnelles conformément au RGPD.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/legal/insurance">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Assurance et protection
                  </CardTitle>
                  <CardDescription>
                    Découvrez nos garanties et couvertures d'assurance pour vos locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Informations détaillées sur les assurances incluses, les franchises et les procédures en cas de sinistre.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Contact Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Questions légales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant nos conditions générales d'utilisation ou 
                nos politiques, n'hésitez pas à nous contacter :
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link to="/contact">
                    Nous contacter
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/faq">
                    Consulter la FAQ
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

export default Legal;
