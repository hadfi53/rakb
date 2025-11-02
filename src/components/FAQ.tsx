
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment fonctionne la location de véhicules ?",
    answer: "RAKB connecte les locataires avec des agences de location professionnelles. Le processus est simple : créez un compte, trouvez un véhicule qui vous convient, réservez-le en ligne et récupérez-le à l'agence ou en livraison."
  },
  {
    question: "Comment sont protégés les véhicules ?",
    answer: "Tous les véhicules sont couverts par notre assurance tous risques pendant la durée de la location. De plus, nous vérifions l'identité de tous les utilisateurs et leur historique de conduite."
  },
  {
    question: "Quels sont les documents nécessaires pour louer ?",
    answer: "Pour louer un véhicule, vous devez avoir un permis de conduire valide depuis plus de 2 ans, une pièce d'identité et une carte bancaire à votre nom."
  },
  {
    question: "Comment sont gérés les paiements ?",
    answer: "Les paiements sont sécurisés et gérés directement par notre plateforme. Le montant est débité au moment de la réservation et transféré au propriétaire après la location."
  },
  {
    question: "Que faire en cas de problème pendant la location ?",
    answer: "Notre service client est disponible 24/7. En cas de problème, contactez-nous immédiatement via l'application ou par téléphone. Une assistance routière est incluse dans chaque location."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
          <p className="text-gray-600">
            Tout ce que vous devez savoir sur la location de véhicules avec RAKB
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
