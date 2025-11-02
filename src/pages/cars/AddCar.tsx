import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Car, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, FileText, Camera, DollarSign, MapPin, Shield, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVehicle } from "@/hooks/use-vehicle";
import { VehicleFormData } from "@/types/vehicle";
import { VerificationBanner } from "@/components/VerificationBanner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import existing components
import ImageUpload from "./components/ImageUpload";
import VehicleBasicInfo from "./components/VehicleBasicInfo";
import VehicleDetails from "./components/VehicleDetails";
import LocationInput from "./components/LocationInput";
import VehicleSpecs from "./components/VehicleSpecs";
import VehicleDescription from "./components/VehicleDescription";

type VehicleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface RequiredDocument {
  type: string;
  label: string;
  uploaded: boolean;
  file?: File;
  url?: string;
}

const STEPS = [
  { id: 1, title: "Informations générales", icon: Car },
  { id: 2, title: "Documents obligatoires", icon: FileText },
  { id: 3, title: "Photos", icon: Camera },
  { id: 4, title: "Tarification", icon: DollarSign },
  { id: 5, title: "Localisation & Disponibilité", icon: MapPin },
  { id: 6, title: "Politique & Conditions", icon: Shield },
  { id: 7, title: "Prévisualisation", icon: Eye },
];

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getUserRole, isVerifiedHost } = useAuth();
  const [currentStep, setCurrentStep] = useState<VehicleStep>(1);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  
  const { createVehicle, loading: submitting } = useVehicle({
    onSuccess: (vehicle) => {
      toast({
        title: "Succès",
        description: "Votre véhicule a été ajouté avec succès et est en attente de modération",
      });
      navigate('/dashboard/owner/vehicles');
    },
    onError: (err) => {
      console.error("Error creating vehicle:", err);
      setError("Une erreur est survenue lors de l'ajout du véhicule. Veuillez réessayer.");
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([
    { type: 'identity', label: 'Pièce d\'identité / Passport', uploaded: false },
    { type: 'vehicle_registration', label: 'Carte grise', uploaded: false },
    { type: 'insurance', label: 'Assurance', uploaded: false },
    { type: 'technical_inspection', label: 'Contrôle technique', uploaded: false },
  ]);

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    registration_number: "",
    price_per_day: "",
    location: "",
    description: "",
    transmission: "",
    fuel_type: "",
    seats: "",
    color: "",
    mileage: "",
    luggage: "",
    features: [] as string[],
    energy: "",
    doors: "",
    // Pricing
    deposit: "",
    // Location & Availability
    delivery_zone: "",
    pickup_hours: "",
    return_hours: "",
    // Policies
    cancellation_policy: "moderate" as 'flexible' | 'moderate' | 'strict',
    fuel_policy: "same_level",
    mileage_policy: "unlimited",
    deductible: "",
  });

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        setIsCheckingVerification(true);
        const verified = await isVerifiedHost();
        setIsVerified(verified);
        setIsCheckingVerification(false);
      } else {
        setIsVerified(null);
        setIsCheckingVerification(false);
      }
    };
    checkVerification();
  }, [user, isVerifiedHost]);

  // Check user role
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }
      try {
        const userRole = await getUserRole();
        if (userRole !== 'owner' && userRole !== 'admin') {
          toast({
            variant: "destructive",
            title: "Accès restreint",
            description: "Vous devez être une agence pour ajouter des véhicules",
          });
          navigate("/become-owner");
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du rôle:", err);
      }
    };
    checkRole();
  }, [user, getUserRole, navigate, toast]);

  const progress = (currentStep / 7) * 100;

  const validateStep = (step: VehicleStep): boolean => {
    switch (step) {
      case 1:
        if (!formData.brand || !formData.model || !formData.year || !formData.registration_number) {
          toast({
            variant: "destructive",
            title: "Informations incomplètes",
            description: "Veuillez remplir tous les champs obligatoires",
          });
          return false;
        }
        return true;
      case 2:
        const allDocsUploaded = requiredDocuments.every(doc => doc.uploaded);
        if (!allDocsUploaded) {
          toast({
            variant: "destructive",
            title: "Documents manquants",
            description: "Tous les documents obligatoires doivent être téléchargés",
          });
          return false;
        }
        return true;
      case 3:
        if (images.length < 5) {
          toast({
            variant: "destructive",
            title: "Photos insuffisantes",
            description: "Vous devez ajouter au moins 5 photos du véhicule",
          });
          return false;
        }
        return true;
      case 4:
        if (!formData.price_per_day || parseFloat(formData.price_per_day) <= 0) {
          toast({
            variant: "destructive",
            title: "Tarif invalide",
            description: "Veuillez définir un tarif journalier valide",
          });
          return false;
        }
        return true;
      case 5:
        if (!formData.location) {
          toast({
            variant: "destructive",
            title: "Localisation manquante",
            description: "Veuillez indiquer la localisation du véhicule",
          });
          return false;
        }
        return true;
      case 6:
        return true; // Policies are optional with defaults
      case 7:
        return true; // Preview step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) {
        setCurrentStep((prev) => (prev + 1) as VehicleStep);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as VehicleStep);
      window.scrollTo(0, 0);
    }
  };

  const handleDocumentUpload = (type: string, file: File) => {
    setRequiredDocuments(prev => prev.map(doc => 
      doc.type === type 
        ? { ...doc, uploaded: true, file, url: URL.createObjectURL(file) }
        : doc
    ));
    toast({
      title: "Document téléchargé",
      description: "Le document a été ajouté avec succès",
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    setLoading(true);
    setError(null);

    try {
      const vehicleFormData: VehicleFormData = {
        make: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price_per_day: parseFloat(formData.price_per_day),
        location: formData.location,
        description: formData.description,
        transmission: formData.transmission as 'automatic' | 'manual' | 'semi-automatic',
        fuel_type: formData.fuel_type as 'diesel' | 'essence' | 'hybrid' | 'electric',
        seats: formData.seats ? parseInt(formData.seats) : undefined,
        color: formData.color,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        luggage: formData.luggage ? parseInt(formData.luggage) : undefined,
        images: images,
        features: formData.features,
        category: 'Berline',
      };

      // Le statut de publication sera défini comme 'pending_review' pour modération
      // Dans un vrai scénario, cela serait géré par le backend
      await createVehicle(vehicleFormData);
    } catch (error) {
      console.error("Error submitting vehicle:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du véhicule",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <VerificationBanner type="host" blocking={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/dashboard/owner"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ajouter un véhicule</h1>
          <p className="text-gray-600 mt-2">Complétez toutes les étapes pour publier votre véhicule</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Étape {currentStep} sur {STEPS.length}
              </span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Steps Navigation */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium whitespace-nowrap">{step.title}</span>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = STEPS[currentStep - 1].icon;
                return <Icon className="w-5 h-5" />;
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: General Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <VehicleBasicInfo
                    brand={formData.brand}
                    model={formData.model}
                    onBrandChange={(value) => setFormData({ ...formData, brand: value })}
                    onModelChange={(value) => setFormData({ ...formData, model: value })}
                  />
                  <VehicleDetails
                    year={formData.year}
                    price={formData.price_per_day}
                    onYearChange={(value) => setFormData({ ...formData, year: value })}
                    onPriceChange={(value) => setFormData({ ...formData, price_per_day: value })}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numéro d'immatriculation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                      placeholder="Ex: 12345-A-67"
                      required
                    />
                  </div>
                  <VehicleSpecs
                    transmission={formData.transmission}
                    fuel={formData.fuel_type}
                    onTransmissionChange={(value) => setFormData({ ...formData, transmission: value })}
                    onFuelChange={(value) => setFormData({ ...formData, fuel_type: value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre de places</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre de portes</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.doors}
                      onChange={(e) => setFormData({ ...formData, doors: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Couleur</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Noir"
                    />
                  </div>
                </div>
                <VehicleDescription
                  description={formData.description}
                  onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
                />
              </div>
            )}

            {/* Step 2: Required Documents */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Documents obligatoires</AlertTitle>
                  <AlertDescription>
                    Tous ces documents sont requis pour publier votre véhicule. Ils seront vérifiés par notre équipe.
                  </AlertDescription>
                </Alert>
                {requiredDocuments.map((doc) => (
                  <Card key={doc.type} className={doc.uploaded ? "border-green-500" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.label}</p>
                            <p className="text-sm text-gray-500">Document requis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.uploaded ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Téléchargé
                            </Badge>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocumentUpload(doc.type, file);
                                }}
                              />
                              <Button variant="outline" size="sm" as="span">
                                Télécharger
                              </Button>
                            </label>
                          )}
                        </div>
                      </div>
                      {doc.url && (
                        <div className="mt-3">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            Voir le document
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert className={images.length >= 5 ? "border-green-500" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Photos du véhicule</AlertTitle>
                  <AlertDescription>
                    Ajoutez au moins 5 photos de qualité : extérieur (avant/arrière), intérieur, coffre, tableau de bord.
                    {images.length >= 5 && (
                      <span className="block mt-2 text-green-600 font-medium">
                        ✓ {images.length} photos ajoutées
                      </span>
                    )}
                    {images.length < 5 && (
                      <span className="block mt-2 text-amber-600">
                        Minimum 5 photos requises ({images.length}/5)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
                <ImageUpload onImagesChange={setImages} initialImages={images} />
              </div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prix par jour (MAD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.price_per_day}
                      onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                      placeholder="890"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Caution (MAD)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      placeholder="2000"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">Montant remboursable après retour du véhicule</p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les frais de service (10%) seront automatiquement ajoutés au prix total pour le locataire.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 5: Location & Availability */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <LocationInput
                  location={formData.location}
                  onLocationChange={(value) => setFormData({ ...formData, location: value })}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Horaires de prise en charge</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.pickup_hours}
                      onChange={(e) => setFormData({ ...formData, pickup_hours: e.target.value })}
                      placeholder="Ex: 9h00 - 18h00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Horaires de retour</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.return_hours}
                      onChange={(e) => setFormData({ ...formData, return_hours: e.target.value })}
                      placeholder="Ex: 9h00 - 18h00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Zone de livraison (optionnel)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.delivery_zone}
                    onChange={(e) => setFormData({ ...formData, delivery_zone: e.target.value })}
                    placeholder="Ex: Casablanca et environs"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Policies */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Politique d'annulation</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.cancellation_policy}
                    onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value as any })}
                  >
                    <option value="flexible">Flexible (48h avant)</option>
                    <option value="moderate">Modérée (7 jours avant)</option>
                    <option value="strict">Stricte (30 jours avant)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Politique de carburant</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.fuel_policy}
                    onChange={(e) => setFormData({ ...formData, fuel_policy: e.target.value })}
                  >
                    <option value="same_level">Retourner avec le même niveau</option>
                    <option value="full">Retourner plein</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Kilométrage</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.mileage_policy}
                    onChange={(e) => setFormData({ ...formData, mileage_policy: e.target.value })}
                  >
                    <option value="unlimited">Illimité inclus</option>
                    <option value="limited">Limité (voir détails)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Franchise (MAD)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.deductible}
                    onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Preview */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Prévisualisation</AlertTitle>
                  <AlertDescription>
                    Vérifiez toutes les informations avant de publier votre véhicule.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Véhicule:</span>
                        <span className="font-medium">{formData.brand} {formData.model} {formData.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Immatriculation:</span>
                        <span className="font-medium">{formData.registration_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transmission:</span>
                        <span className="font-medium">{formData.transmission || "Non spécifié"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carburant:</span>
                        <span className="font-medium">{formData.fuel_type || "Non spécifié"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tarification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prix/jour:</span>
                        <span className="font-medium">{formData.price_per_day} MAD</span>
                      </div>
                      {formData.deposit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Caution:</span>
                          <span className="font-medium">{formData.deposit} MAD</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Localisation:</span>
                        <span className="font-medium">{formData.location || "Non spécifié"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vérifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      {requiredDocuments.every(doc => doc.uploaded) ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={requiredDocuments.every(doc => doc.uploaded) ? "text-green-700" : "text-red-700"}>
                        Documents ({requiredDocuments.filter(d => d.uploaded).length}/{requiredDocuments.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {images.length >= 5 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={images.length >= 5 ? "text-green-700" : "text-red-700"}>
                        Photos ({images.length}/5 minimum)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
          
          {currentStep < 7 ? (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading || submitting ? "Publication..." : "Publier le véhicule"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCar;
