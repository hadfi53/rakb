import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search,
  MessageCircle,
  Book,
  Phone,
  Mail,
  HelpCircle,
  ArrowRight,
  FileText
} from "lucide-react";
import { companyInfo, getPhoneLink, getEmailLink } from "@/lib/config/company";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const quickLinks = [
    {
      icon: Book,
      title: "Guides",
      description: "Tutoriels et guides pas à pas",
      link: "/guide"
    },
    {
      icon: FileText,
      title: "FAQ",
      description: "Réponses aux questions fréquentes",
      link: "/faq"
    },
    {
      icon: MessageCircle,
      title: "Contact",
      description: "Parlez avec notre équipe",
      link: "/contact"
    },
    {
      icon: Phone,
      title: "Urgence",
      description: "Assistance 24/7",
      link: "/emergency"
    }
  ];

  const helpCategories = [
    {
      title: "Réservation et paiement",
      items: [
        {
          question: "Comment réserver un véhicule ?",
          answer: "Recherchez un véhicule avec vos critères (dates, localisation), consultez les détails, puis cliquez sur 'Réserver'. Remplissez le formulaire et effectuez le paiement sécurisé."
        },
        {
          question: "Quels modes de paiement sont acceptés ?",
          answer: "Nous acceptons les cartes bancaires (Visa, Mastercard) et les paiements en ligne sécurisés. Le paiement est effectué lors de la réservation."
        },
        {
          question: "Puis-je annuler ma réservation ?",
          answer: "Oui, selon les conditions de l'agence. Les modalités d'annulation sont indiquées lors de la réservation. Certaines annulations peuvent être gratuites jusqu'à 24h avant."
        }
      ]
    },
    {
      title: "Documents et vérification",
      items: [
        {
          question: "Quels documents sont nécessaires ?",
          answer: "Vous devez avoir un permis de conduire valide depuis plus de 2 ans, une pièce d'identité valide, et une carte bancaire au même nom pour la caution."
        },
        {
          question: "Comment se passe la vérification d'identité ?",
          answer: "La vérification se fait en ligne lors de l'inscription. Vous devrez télécharger vos documents qui seront vérifiés par notre équipe avant votre première location."
        }
      ]
    },
    {
      title: "Véhicules et assurance",
      items: [
        {
          question: "Les véhicules sont-ils assurés ?",
          answer: "Oui, toutes nos locations incluent une assurance tous risques. Les détails de la couverture sont indiqués lors de la réservation et dans vos documents de location."
        },
        {
          question: "Que faire en cas d'accident ?",
          answer: "Contactez immédiatement notre service d'urgence 24/7 et l'agence. Ne quittez jamais les lieux sans constat amiable. Notre équipe vous guidera dans les démarches."
        },
        {
          question: "Puis-je conduire le véhicule hors du Maroc ?",
          answer: "Cela dépend des conditions de l'agence. Certaines locations autorisent la sortie du territoire, d'autres non. Vérifiez les conditions lors de la réservation."
        }
      ]
    },
    {
      title: "Livraison et récupération",
      items: [
        {
          question: "Où puis-je récupérer mon véhicule ?",
          answer: "Vous pouvez récupérer le véhicule à l'agence, à l'aéroport (si disponible), ou demander une livraison à votre adresse selon les options offertes par l'agence."
        },
        {
          question: "Puis-je modifier les dates après réservation ?",
          answer: "Contactez l'agence directement ou notre service client. Les modifications sont possibles selon la disponibilité et peuvent engendrer des frais supplémentaires."
        }
      ]
    }
  ];

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-white pt-[106px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Centre d'aide
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Trouvez rapidement les réponses à vos questions
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher dans l'aide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} to={link.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <link.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{link.title}</h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : searchQuery ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  Aucun résultat trouvé pour "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Effacer la recherche
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">
                  <Mail className="mr-2" />
                  Envoyer un email
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/emergency">
                  <Phone className="mr-2" />
                  Appeler le support
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

export default Help;

