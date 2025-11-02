import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import FAQ from "@/components/FAQ";

const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      category: "Général",
      questions: [
        {
          question: "Qu'est-ce que RAKB ?",
          answer: "RAKB est une plateforme de location de véhicules au Maroc qui connecte les locataires avec des agences de location professionnelles. Nous offrons un processus de réservation simple, sécurisé et transparent."
        },
        {
          question: "Comment fonctionne RAKB ?",
          answer: "Vous recherchez un véhicule selon vos critères, consultez les détails et les avis, puis réservez en ligne. Vous récupérez le véhicule à l'agence ou en livraison selon les options disponibles."
        },
        {
          question: "RAKB est-il disponible partout au Maroc ?",
          answer: "Oui, RAKB est disponible dans toutes les grandes villes marocaines et continue de s'étendre. Vous pouvez rechercher des véhicules par localisation sur notre plateforme."
        }
      ]
    },
    {
      category: "Réservation",
      questions: [
        {
          question: "Comment réserver un véhicule ?",
          answer: "Recherchez un véhicule avec vos critères (dates, localisation, type), consultez les détails, puis cliquez sur 'Réserver'. Remplissez le formulaire avec vos informations et effectuez le paiement sécurisé."
        },
        {
          question: "Quels sont les documents nécessaires pour réserver ?",
          answer: "Vous devez avoir un permis de conduire valide depuis plus de 2 ans, une pièce d'identité valide (CNIE ou passeport), et une carte bancaire au même nom pour la réservation et la caution."
        },
        {
          question: "Puis-je modifier ou annuler ma réservation ?",
          answer: "Oui, selon les conditions de l'agence. Les modalités d'annulation sont indiquées lors de la réservation. Certaines annulations peuvent être gratuites jusqu'à 24h ou 48h avant le début de la location. Contactez l'agence ou notre service client pour toute modification."
        },
        {
          question: "Y a-t-il un âge minimum pour louer ?",
          answer: "Vous devez être âgé d'au moins 21 ans et avoir un permis de conduire valide depuis au moins 2 ans. Certains véhicules peuvent avoir des restrictions d'âge supplémentaires."
        }
      ]
    },
    {
      category: "Paiement",
      questions: [
        {
          question: "Quels modes de paiement sont acceptés ?",
          answer: "Nous acceptons les cartes bancaires (Visa, Mastercard) et les paiements en ligne sécurisés. Le paiement est effectué lors de la réservation."
        },
        {
          question: "Quand suis-je facturé ?",
          answer: "Le paiement est débité au moment de la réservation. Une caution peut également être prélevée et sera restituée après la fin de la location si le véhicule est rendu dans les mêmes conditions."
        },
        {
          question: "Y a-t-il des frais cachés ?",
          answer: "Non, tous les frais sont indiqués clairement lors de la réservation : prix de location, assurance, et éventuels frais supplémentaires (livraison, options). Aucun frais caché."
        }
      ]
    },
    {
      category: "Véhicules et assurance",
      questions: [
        {
          question: "Les véhicules sont-ils assurés ?",
          answer: "Oui, toutes nos locations incluent une assurance tous risques. Les détails de la couverture sont indiqués lors de la réservation et dans vos documents de location."
        },
        {
          question: "Que faire en cas d'accident ?",
          answer: "Contactez immédiatement notre service d'urgence 24/7 et l'agence. Ne quittez jamais les lieux sans constat amiable. Notre équipe vous guidera dans toutes les démarches nécessaires."
        },
        {
          question: "Puis-je conduire le véhicule hors du Maroc ?",
          answer: "Cela dépend des conditions de l'agence. Certaines locations autorisent la sortie du territoire, d'autres non. Vérifiez les conditions lors de la réservation et contactez l'agence pour confirmation."
        },
        {
          question: "Que se passe-t-il si le véhicule a un problème technique ?",
          answer: "Contactez immédiatement l'agence et notre service d'assistance. Si le problème ne peut être résolu rapidement, nous ferons de notre mieux pour vous proposer un véhicule de remplacement."
        }
      ]
    },
    {
      category: "Livraison et récupération",
      questions: [
        {
          question: "Où puis-je récupérer mon véhicule ?",
          answer: "Vous pouvez récupérer le véhicule à l'agence, à l'aéroport (si cette option est disponible), ou demander une livraison à votre adresse selon les options offertes par l'agence."
        },
        {
          question: "Que se passe-t-il à la récupération ?",
          answer: "Vous rencontrerez l'agence au point de rendez-vous convenu. Vous vérifierez ensemble l'état du véhicule, signerez les documents nécessaires, et recevrez les clés et les informations importantes."
        },
        {
          question: "Puis-je prolonger ma location ?",
          answer: "Oui, si le véhicule est disponible. Contactez l'agence directement ou notre service client. Les prolongations peuvent engendrer des frais supplémentaires selon les conditions."
        }
      ]
    },
    {
      category: "Agences",
      questions: [
        {
          question: "Comment devenir une agence partenaire ?",
          answer: "Créez un compte agence, remplissez les informations et téléchargez les documents requis. Notre équipe vérifiera votre dossier et vous contactera rapidement pour finaliser votre inscription."
        },
        {
          question: "Quels sont les tarifs pour les agences ?",
          answer: "Nos tarifs sont flexibles et adaptés à votre activité. Consultez notre page tarifs pour plus d'informations ou contactez notre équipe commerciale."
        },
        {
          question: "Comment sont versés les paiements aux agences ?",
          answer: "Les paiements sont sécurisés et versés directement sur votre compte selon le calendrier convenu, généralement sous 48h après la fin de la location."
        }
      ]
    }
  ];

  const allQuestions = faqCategories.flatMap(cat => 
    cat.questions.map(q => ({ ...q, category: cat.category }))
  );

  const filteredQuestions = searchQuery
    ? allQuestions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allQuestions;

  const filteredCategories = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Questions fréquemment posées
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
                  placeholder="Rechercher dans les FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, itemIndex) => (
                      <AccordionItem
                        key={itemIndex}
                        value={`category-${categoryIndex}-item-${itemIndex}`}
                      >
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
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  Aucun résultat trouvé pour "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Effacer la recherche
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Component from Home */}
      <section className="py-16 bg-gray-50">
        <FAQ />
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Vous ne trouvez pas la réponse ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/help">
                  <HelpCircle className="mr-2" />
                  Centre d'aide
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/contact">
                  Nous contacter
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

export default FaqPage;

