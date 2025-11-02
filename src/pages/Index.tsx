
import SearchBar from "@/components/SearchBar";
import HowItWorks from "@/components/HowItWorks";
import PopularCars from "@/components/PopularCars";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";
import FAQ from "@/components/FAQ";
import FloatingCTA from "@/components/FloatingCTA";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "Location de voitures au Maroc",
    description: "Réservez votre voiture de location au Maroc en quelques clics. Grand choix de véhicules, tarifs compétitifs, assurance incluse. Service client 24/7.",
    url: "https://rakb.ma/",
  });
  return (
    <div className="min-h-screen bg-white">
      {/* Section de recherche principale */}
      <section className="pt-24 pb-12 px-4 md:pt-32 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              La location de voiture simplifiée
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Trouvez et réservez la voiture idéale en quelques clics
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <main className="space-y-12 md:space-y-24">
        <HowItWorks />
        <PopularCars />
        <Stats />
        <WhyChooseUs />
        <Testimonials />
        <FAQ />
      </main>

      <FloatingCTA />
    </div>
  );
};

export default Index;
