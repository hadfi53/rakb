import { useState } from "react";
import { Mail, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { companyInfo, getPhoneLink, getEmailLink } from "@/lib/config/company";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("contact-form", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(data.message || "Votre message a été envoyé avec succès!");
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error(data?.error || "Erreur lors de l'envoi du message");
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error(
        error.message || "Une erreur est survenue. Veuillez réessayer plus tard."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-center text-3xl">Contactez-nous</CardTitle>
              <CardDescription className="text-center">
                Notre équipe est à votre disposition pour répondre à vos questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Sujet
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Comment pouvons-nous vous aider ?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:ring-primary"
                    placeholder="Votre message..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le message"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-12 text-center text-gray-600">
            <p className="mb-4">Vous pouvez aussi nous contacter :</p>
            <div className="space-y-2">
              <p>
                <a href={getEmailLink()} className="hover:text-primary transition-colors">
                  Email: {companyInfo.email}
                </a>
              </p>
              <p>
                <a href={getPhoneLink()} className="hover:text-primary transition-colors">
                  Téléphone: {companyInfo.phoneDisplay}
                </a>
              </p>
              <p>{companyInfo.businessHours.weekdays}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
