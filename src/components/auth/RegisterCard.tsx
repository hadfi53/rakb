
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { RegisterForm } from "./RegisterForm";

export const RegisterCard = () => {
  return (
    <Card className="w-full max-w-md bg-white shadow-md border-0 mt-4 md:mt-0">
      <CardHeader className="text-center pb-4 md:pb-6">
        <div className="mx-auto w-fit mb-2">
          <Car className="h-10 w-10 md:h-12 md:w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Créez votre compte
        </CardTitle>
        <CardDescription className="text-sm md:text-base mt-2">
          Déjà inscrit ?{" "}
          <Link to="/auth/login" className="text-primary hover:text-primary-dark transition-colors font-medium">
            Connectez-vous
          </Link>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
};
