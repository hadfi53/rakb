
import { Users, Car, Star, Trophy } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "100+",
    label: "Utilisateurs actifs",
  },
  {
    icon: Car,
    value: "50+",
    label: "Véhicules disponibles",
  },
  {
    icon: Star,
    value: "4.7/5",
    label: "Note moyenne",
  },
  {
    icon: Trophy,
    value: "95%",
    label: "Clients satisfaits",
  },
];

const Stats = () => {
  return (
    <section className="py-16 bg-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Une communauté en pleine croissance
          </h2>
          <p className="mt-4 text-gray-600">
            Rejoignez nos premiers utilisateurs satisfaits
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
