
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Politique de confidentialité</h1>
            <p className="text-gray-600">Comment nous protégeons vos données personnelles</p>
          </div>

          <div className="prose max-w-none">
            <h2>1. Collecte des données</h2>
            <p>
              Nous collectons uniquement les données nécessaires au bon fonctionnement 
              de nos services. Ces données incluent :
            </p>
            <ul>
              <li>Informations d'identification (nom, prénom, email)</li>
              <li>Informations de contact</li>
              <li>Informations sur les véhicules (pour les propriétaires)</li>
            </ul>

            <h2>2. Utilisation des données</h2>
            <p>
              Vos données sont utilisées pour :
            </p>
            <ul>
              <li>La gestion de votre compte</li>
              <li>La mise en relation entre propriétaires et locataires</li>
              <li>L'amélioration de nos services</li>
            </ul>

            <h2>3. Protection des données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger 
              vos données contre tout accès non autorisé.
            </p>

            <h2>4. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification 
              et de suppression de vos données personnelles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
