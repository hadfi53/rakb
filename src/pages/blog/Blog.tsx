import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Les meilleurs conseils pour une location réussie",
      excerpt: "Découvrez nos astuces pour tirer le meilleur parti de votre location de véhicule et éviter les pièges courants.",
      author: "Équipe RAKB",
      date: "15 Janvier 2024",
      category: "Conseils",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800"
    },
    {
      id: 2,
      title: "Comment choisir le bon véhicule selon vos besoins",
      excerpt: "Guide complet pour sélectionner le véhicule idéal en fonction de votre destination, du nombre de passagers et de vos préférences.",
      author: "Équipe RAKB",
      date: "10 Janvier 2024",
      category: "Guide",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800"
    },
    {
      id: 3,
      title: "Assurance et protection : tout comprendre",
      excerpt: "Explications détaillées sur les garanties incluses dans nos locations et comment vous protéger efficacement.",
      author: "Équipe RAKB",
      date: "5 Janvier 2024",
      category: "Assurance",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800"
    },
    {
      id: 4,
      title: "Top 10 des destinations à découvrir au Maroc en voiture",
      excerpt: "Explorez les plus beaux circuits routiers du Maroc et découvrez des destinations incontournables à visiter en location.",
      author: "Équipe RAKB",
      date: "1 Janvier 2024",
      category: "Voyage",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800"
    }
  ];

  const categories = ["Tous", "Conseils", "Guide", "Assurance", "Voyage", "Actualités"];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Blog RAKB
            </h1>
            <p className="text-xl text-gray-600">
              Conseils, guides et actualités sur la location de véhicules au Maroc
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "Tous" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {post.category}
                    </span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl mb-3">{post.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <Button variant="ghost" asChild>
                    <Link to={`/blog/${post.id}`}>
                      Lire la suite
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Restez informé
            </h2>
            <p className="text-gray-600 mb-8">
              Recevez nos derniers articles et conseils directement dans votre boîte mail
            </p>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>S'abonner</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;

