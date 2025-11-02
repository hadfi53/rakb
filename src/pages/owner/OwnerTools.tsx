
import { Car, MessageSquare, Bell, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OwnerTools = () => {
  const notifications = [
    {
      id: 1,
      type: "message",
      content: "Nouvelle demande de réservation pour votre BMW Serie 3",
      time: "Il y a 5 minutes",
      read: false
    },
    {
      id: 2,
      type: "reminder",
      content: "Retour prévu aujourd'hui pour la Mercedes Classe C",
      time: "Il y a 1 heure",
      read: true
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "Mohammed A.",
      content: "Bonjour, est-ce que la voiture est disponible pour ce weekend ?",
      time: "10:30",
      unread: true
    },
    {
      id: 2,
      sender: "Karim B.",
      content: "Merci pour la location, tout s'est très bien passé !",
      time: "Hier",
      unread: false
    }
  ];

  const tools = [
    {
      title: "Centre de notifications",
      description: "Gérez vos alertes et notifications importantes",
      icon: Bell,
      badge: "2 nouvelles"
    },
    {
      title: "Messagerie",
      description: "Communiquez avec vos locataires",
      icon: MessageSquare,
      badge: "1 non lu"
    },
    {
      title: "Calendrier de disponibilité",
      description: "Définissez les périodes de disponibilité de vos véhicules",
      icon: Calendar
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Car className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Outils pour les propriétaires
            </h1>
            <p className="text-gray-600">
              Gérez vos locations et optimisez vos revenus avec nos outils dédiés
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tools.map((tool, index) => (
              <Card key={index} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <tool.icon className="h-6 w-6 text-primary" />
                    </div>
                    {tool.badge && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Notifications and Messages Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notifications récentes</CardTitle>
                  <Badge variant="outline">{notifications.filter(n => !n.read).length} nouvelles</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        !notification.read ? "bg-primary/5 border-primary/10" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages récents</CardTitle>
                  <Badge variant="outline">{messages.filter(m => m.unread).length} non lus</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.unread ? "bg-primary/5 border-primary/10" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{message.sender}</p>
                          <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                        </div>
                        {message.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerTools;
