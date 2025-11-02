
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah L.",
    role: "Locataire",
    image: "/placeholder.svg",
    content: "J'ai trouvé la voiture parfaite pour mes vacances à un prix très compétitif. Le processus était simple et le propriétaire très accueillant !",
    rating: 5
  },
  {
    name: "Mohammed A.",
    role: "Propriétaire",
    image: "/placeholder.svg",
    content: "Rakeb m'a permis de rentabiliser ma voiture quand je ne l'utilise pas. La plateforme est vraiment bien pensée et l'équipe très réactive.",
    rating: 5
  },
  {
    name: "Karim B.",
    role: "Locataire",
    image: "/placeholder.svg",
    content: "Une expérience de location super simple et transparente. Je recommande vivement !",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Ce que disent nos utilisateurs</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez les expériences de notre communauté grandissante
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index}
            className="relative overflow-visible"
          >
            <CardContent className="pt-12 pb-8">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                <p className="text-gray-600 text-sm">{testimonial.role}</p>
                <div className="flex justify-center items-center mt-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-gray-600 text-center italic">"{testimonial.content}"</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
