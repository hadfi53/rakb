import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

// Blog posts data - In production, this would come from Supabase or a CMS
const blogPosts: Record<string, {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
}> = {
  "1": {
    id: "1",
    title: "Les meilleurs conseils pour une location réussie",
    excerpt: "Découvrez nos astuces pour tirer le meilleur parti de votre location de véhicule et éviter les pièges courants.",
    author: "Équipe RAKB",
    date: "15 Janvier 2024",
    category: "Conseils",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800",
    content: `
      <h2>Introduction</h2>
      <p>Louer une voiture peut sembler simple, mais quelques conseils pratiques peuvent faire toute la différence pour garantir une expérience réussie. Dans cet article, nous partageons nos meilleures recommandations basées sur des années d'expérience dans le secteur de la location au Maroc.</p>

      <h2>1. Planifiez à l'avance</h2>
      <p>La réservation anticipée vous permet non seulement de bénéficier de meilleurs tarifs, mais aussi d'avoir accès à un plus large choix de véhicules. Réservez au moins une semaine à l'avance pour les périodes de haute saison.</p>

      <h2>2. Vérifiez les documents nécessaires</h2>
      <p>Assurez-vous d'avoir tous les documents requis :</p>
      <ul>
        <li>Permis de conduire valide (minimum 2 ans d'ancienneté)</li>
        <li>Carte d'identité ou passeport</li>
        <li>Carte bancaire pour la caution</li>
        <li>Preuve d'assurance si nécessaire</li>
      </ul>

      <h2>3. Inspectez le véhicule avant le départ</h2>
      <p>Avant de partir, prenez le temps d'inspecter soigneusement le véhicule. Notez tous les dommages existants (rayures, bosses) sur le constat. Prenez des photos de tous les angles pour votre protection.</p>

      <h2>4. Comprenez votre assurance</h2>
      <p>Renseignez-vous sur les garanties incluses dans votre contrat de location. Vérifiez les franchises et les exclusions. Souscrire à une assurance complémentaire peut être judicieux selon votre destination.</p>

      <h2>5. Respectez les règles de circulation</h2>
      <p>Connaissez les règles de circulation locales. Au Maroc, les limitations de vitesse sont de 60 km/h en ville, 100 km/h sur route et 120 km/h sur autoroute. Les amendes peuvent être importantes.</p>

      <h2>6. Gardez tous les documents à portée</h2>
      <p>Conservez toujours le contrat de location, la carte grise et les documents d'assurance dans le véhicule. Cela vous facilitera la vie en cas de contrôle de police ou d'accident.</p>

      <h2>Conclusion</h2>
      <p>En suivant ces conseils simples, vous maximiserez vos chances de vivre une expérience de location agréable et sans stress. N'hésitez pas à contacter notre équipe si vous avez des questions.</p>
    `
  },
  "2": {
    id: "2",
    title: "Comment choisir le bon véhicule selon vos besoins",
    excerpt: "Guide complet pour sélectionner le véhicule idéal en fonction de votre destination, du nombre de passagers et de vos préférences.",
    author: "Équipe RAKB",
    date: "10 Janvier 2024",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800",
    content: `
      <h2>Choisir le véhicule adapté à vos besoins</h2>
      <p>Le choix du véhicule est crucial pour garantir votre confort et votre sécurité lors de votre location. Plusieurs facteurs doivent être pris en compte.</p>

      <h2>Nombre de passagers et bagages</h2>
      <p>Estimez le nombre de personnes et le volume de bagages. Pour 2-3 personnes, une citadine suffit. Pour 4-5 personnes, optez pour une berline ou un SUV compact. Pour plus de 5 personnes, un monospace ou un grand SUV est nécessaire.</p>

      <h2>Type de route</h2>
      <p>Les routes marocaines varient beaucoup. Pour la ville uniquement, une citadine économique convient. Pour les routes de montagne ou les pistes, préférez un SUV avec transmission 4x4.</p>

      <h2>Durée de location</h2>
      <p>Pour de longues distances ou locations prolongées, le confort devient prioritaire. Choisissez un véhicule avec bonne consommation et espace confortable.</p>

      <h2>Budget</h2>
      <p>Établissez votre budget avant de rechercher. N'oubliez pas d'inclure le carburant, les péages et l'assurance complémentaire si nécessaire.</p>
    `
  },
  "3": {
    id: "3",
    title: "Assurance et protection : tout comprendre",
    excerpt: "Explications détaillées sur les garanties incluses dans nos locations et comment vous protéger efficacement.",
    author: "Équipe RAKB",
    date: "5 Janvier 2024",
    category: "Assurance",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800",
    content: `
      <h2>Comprendre votre assurance location</h2>
      <p>L'assurance est un élément essentiel de votre contrat de location. Voici ce que vous devez savoir.</p>

      <h2>Garanties de base</h2>
      <p>Toutes nos locations incluent une assurance responsabilité civile qui couvre les dommages causés aux tiers. C'est obligatoire et inclus dans le prix.</p>

      <h2>Assurance tous risques</h2>
      <p>L'assurance tous risques couvre les dommages au véhicule loué, le vol et l'incendie. Elle est généralement incluse mais avec une franchise. Vous pouvez réduire cette franchise en souscrivant à une option complémentaire.</p>

      <h2>Ce qui n'est pas couvert</h2>
      <p>Certains éléments ne sont généralement pas couverts :</p>
      <ul>
        <li>Dommages aux pneus et jantes</li>
        <li>Vitres non traitées</li>
        <li>Dommages dus à une conduite sous l'influence</li>
        <li>Conduite hors route non autorisée</li>
      </ul>

      <h2>Conseil</h2>
      <p>Lisez attentivement votre contrat avant de signer et n'hésitez pas à poser des questions si quelque chose n'est pas clair.</p>
    `
  },
  "4": {
    id: "4",
    title: "Top 10 des destinations à découvrir au Maroc en voiture",
    excerpt: "Explorez les plus beaux circuits routiers du Maroc et découvrez des destinations incontournables à visiter en location.",
    author: "Équipe RAKB",
    date: "1 Janvier 2024",
    category: "Voyage",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800",
    content: `
      <h2>Les meilleures destinations à découvrir en voiture au Maroc</h2>
      <p>Le Maroc offre des paysages époustouflants accessibles en voiture. Voici nos destinations favorites.</p>

      <h2>1. Route des Cascades d'Ouzoud</h2>
      <p>À 3h de route de Casablanca, les cascades d'Ouzoud sont parmi les plus belles du Maroc. La route est bonne et le paysage magnifique.</p>

      <h2>2. Circuit de l'Atlas</h2>
      <p>Traversez le Haut Atlas pour découvrir des villages berbères authentiques. Prévoir un véhicule robuste et une conduite prudente.</p>

      <h2>3. Côte Atlantique</h2>
      <p>De Casablanca à Essaouira, longez la côte pour des plages magnifiques. Route excellente, parfaite pour une berline confortable.</p>

      <h2>4. Route des Oasis</h2>
      <p>Partez vers l'est pour découvrir les oasis du désert. Route longue mais sécurisée, prévoir plusieurs arrêts.</p>

      <h2>Conseils pratiques</h2>
      <p>Vérifiez l'état des routes avant de partir, emportez toujours de l'eau et prévoyez du temps supplémentaire pour profiter des paysages.</p>
    `
  }
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = id ? blogPosts[id] : null;

  useSEO({
    title: post?.title || "Article de blog",
    description: post?.excerpt || "Article de blog RAKB",
    url: `https://rakb.ma/blog/${id}`,
    type: "article",
  });

  if (!post) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
            <p className="text-gray-600 mb-8">
              L'article que vous recherchez n'existe pas.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au blog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Image */}
      <section className="relative h-[40vh] md:h-[50vh] bg-gray-200">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-4">
              <span className="bg-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>

            <Card>
              <CardContent className="p-8 md:p-12">
                <div 
                  className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </CardContent>
            </Card>

            <div className="mt-12 text-center">
              <Button asChild size="lg">
                <Link to="/search">
                  Réserver un véhicule maintenant
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;

