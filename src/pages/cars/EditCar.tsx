import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Car, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, FileText, Camera, DollarSign, MapPin, Shield, Eye, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVehicle } from "@/hooks/use-vehicle";
import { Vehicle, VehicleFormData, VehiclePublicationStatus } from "@/types/vehicle";
import { VerificationBanner } from "@/components/VerificationBanner";
import { Badge } from "@/components/ui/badge";
import { VehicleStatusBadge } from "@/components/vehicle/VehicleStatusBadge";

// Import existing components
import ImageUpload from "./components/ImageUpload";
import VehicleBasicInfo from "./components/VehicleBasicInfo";
import VehicleDetails from "./components/VehicleDetails";
import LocationInput from "./components/LocationInput";
import VehicleSpecs from "./components/VehicleSpecs";
import VehicleDescription from "./components/VehicleDescription";

type VehicleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEPS = [
  { id: 1, title: "Informations générales", icon: Car },
  { id: 2, title: "Documents obligatoires", icon: FileText },
  { id: 3, title: "Photos", icon: Camera },
  { id: 4, title: "Tarification", icon: DollarSign },
  { id: 5, title: "Localisation & Disponibilité", icon: MapPin },
  { id: 6, title: "Politique & Conditions", icon: Shield },
  { id: 7, title: "Prévisualisation", icon: Eye },
];

const EditCar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getUserRole, isVerifiedHost } = useAuth();
  const { getVehicleById, updateVehicle, loading: vehicleLoading } = useVehicle();
  
  const [currentStep, setCurrentStep] = useState<VehicleStep>(1);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [originalPublicationStatus, setOriginalPublicationStatus] = useState<VehiclePublicationStatus | undefined>();
  const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);

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
    deposit: "",
    delivery_zone: "",
    pickup_hours: "",
    return_hours: "",
    cancellation_policy: "moderate" as 'flexible' | 'moderate' | 'strict',
    fuel_policy: "same_level",
    mileage_policy: "unlimited",
    deductible: "",
  });

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id || !user) return;

      try {
        setFetchingVehicle(true);
        const vehicle = await getVehicleById(id);

        if (!vehicle) {
          toast({
            variant: "destructive",
            title: "Véhicule introuvable",
            description: "Le véhicule demandé n'existe pas ou a été supprimé",
          });
          navigate('/dashboard/owner/vehicles');
          return;
        }

        // Vérifier que l'utilisateur est propriétaire
        if (vehicle.owner_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à modifier ce véhicule",
          });
          navigate('/dashboard/owner/vehicles');
          return;
        }

        // Sauvegarder le véhicule original et son statut de publication
        setOriginalVehicle(vehicle);
        setOriginalPublicationStatus(vehicle.publication_status);

        // Pré-remplir le formulaire
        setFormData({
          brand: vehicle.make || vehicle.brand || "",
          model: vehicle.model || "",
          year: vehicle.year?.toString() || "",
          registration_number: "",
          price_per_day: vehicle.price_per_day?.toString() || vehicle.price?.toString() || "",
          location: vehicle.location || "",
          description: vehicle.description || "",
          transmission: vehicle.transmission || "",
          fuel_type: vehicle.fuel_type || "",
          seats: vehicle.seats?.toString() || "",
          color: vehicle.color || "",
          mileage: vehicle.mileage?.toString() || "",
          luggage: vehicle.luggage?.toString() || "",
          features: vehicle.features || [],
          energy: "",
          doors: "",
          deposit: "",
          delivery_zone: "",
          pickup_hours: "",
          return_hours: "",
          cancellation_policy: "moderate",
          fuel_policy: "same_level",
          mileage_policy: "unlimited",
          deductible: "",
        });

        setImages(vehicle.images || [vehicle.image_url || ""].filter(Boolean));
      } catch (err) {
        console.error("Error loading vehicle:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du véhicule",
        });
        navigate('/dashboard/owner/vehicles');
      } finally {
        setFetchingVehicle(false);
      }
    };

    loadVehicle();
  }, [id, user, getVehicleById, navigate, toast]);

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
            description: "Vous devez être une agence pour modifier des véhicules",
          });
          navigate("/dashboard");
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
        if (!formData.brand || !formData.model || !formData.year || !formData.price_per_day) {
          toast({
            variant: "destructive",
            title: "Informations incomplètes",
            description: "Veuillez remplir tous les champs obligatoires",
          });
          return false;
        }
        return true;
      case 2:
        return true; // Documents optionnels en édition
      case 3:
        if (images.length < 3) {
          toast({
            variant: "destructive",
            title: "Photos insuffisantes",
            description: "Vous devez conserver au moins 3 photos du véhicule",
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
        return true;
      case 7:
        return true;
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

  const handleSubmit = async () => {
    if (!id || !validateStep(7)) return;

    setLoading(true);
    setError(null);

    try {
      const vehicleFormData: Partial<VehicleFormData> & { publication_status?: VehiclePublicationStatus } = {
        make: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price_per_day: parseFloat(formData.price_per_day),
        location: formData.location,
        description: formData.description,
        transmission: formData.transmission as 'automatic' | 'manual' | 'semi-automatic' | undefined,
        fuel_type: formData.fuel_type as 'diesel' | 'essence' | 'hybrid' | 'electric' | undefined,
        seats: formData.seats ? parseInt(formData.seats) : undefined,
        color: formData.color || undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        luggage: formData.luggage ? parseInt(formData.luggage) : undefined,
        images: images,
        features: formData.features,
      };

      // Déterminer quels champs ont été modifiés
      const hasImageChanges = JSON.stringify(images) !== JSON.stringify(originalVehicle?.images || []);
      const hasDescriptionChanges = formData.description !== originalVehicle?.description;
      const hasMakeModelChanges = formData.brand !== originalVehicle?.make || formData.model !== originalVehicle?.model;
      const hasYearChanges = parseInt(formData.year) !== originalVehicle?.year;
      
      // Seules les modifications importantes nécessitent une re-modération
      // Les modifications de prix, location, transmission, fuel_type, etc. sont automatiques
      const requiresModeration = hasImageChanges || hasDescriptionChanges || hasMakeModelChanges || hasYearChanges;

      // Si le véhicule était actif et que des modifications importantes ont été faites, le mettre en pending_review
      if (originalPublicationStatus === 'active' && requiresModeration) {
        vehicleFormData.publication_status = 'pending_review';
        toast({
          title: "Véhicule mis à jour",
          description: "Votre véhicule a été mis à jour et sera soumis à une nouvelle modération",
        });
      } else if (originalPublicationStatus === 'active' && !requiresModeration) {
        // Si seulement le prix ou d'autres champs mineurs ont été modifiés, garder explicitement le statut actif
        vehicleFormData.publication_status = 'active';
        console.log('✅ Modifications mineures - statut actif conservé');
      }

      const updatedVehicle = await updateVehicle(id, vehicleFormData);
      
      if (updatedVehicle) {
        console.log('✅ Vehicle updated successfully:', {
          id: updatedVehicle.id,
          publication_status: updatedVehicle.publication_status,
          is_approved: (updatedVehicle as any).is_approved
        });
      }
      
      toast({
        title: "Succès",
        description: vehicleFormData.publication_status === 'active' 
          ? "Votre véhicule a été mis à jour avec succès et reste actif"
          : "Votre véhicule a été mis à jour avec succès",
      });
      
      // Reload vehicles list to reflect the update
      // The navigate will trigger a reload in OwnerVehicles component
      navigate('/dashboard/owner/vehicles', { replace: true });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du véhicule",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingVehicle || vehicleLoading || isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données du véhicule...</p>
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
            to="/dashboard/owner/vehicles"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à mes véhicules
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le véhicule</h1>
              <p className="text-gray-600 mt-2">Modifiez les informations de votre véhicule</p>
            </div>
            {originalPublicationStatus && (
              <VehicleStatusBadge status={originalPublicationStatus} />
            )}
          </div>
          {originalPublicationStatus === 'active' && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                Ce véhicule est actuellement actif. Après modification, il sera soumis à une nouvelle modération avant de redevenir actif.
              </AlertDescription>
            </Alert>
          )}
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

        {/* Step Content - Réutilise la même structure qu'AddCar */}
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
                      Numéro d'immatriculation
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                      placeholder="Ex: 12345-A-67"
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
                    <label className="block text-sm font-medium text-gray-700">Couleur</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Noir"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Kilométrage</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      placeholder="15000"
                    />
                  </div>
                </div>
                <VehicleDescription
                  description={formData.description}
                  onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
                />
              </div>
            )}

            {/* Step 2: Documents - Info seulement en édition */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Documents</AlertTitle>
                  <AlertDescription>
                    Les documents existants sont conservés. Vous pouvez les modifier depuis votre profil si nécessaire.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert className={images.length >= 3 ? "border-green-500" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Photos du véhicule</AlertTitle>
                  <AlertDescription>
                    Modifiez les photos de votre véhicule. Minimum 3 photos requises.
                    {images.length >= 3 && (
                      <span className="block mt-2 text-green-600 font-medium">
                        ✓ {images.length} photos
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
                  </div>
                </div>
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
              </div>
            )}

            {/* Step 7: Preview */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Prévisualisation</AlertTitle>
                  <AlertDescription>
                    Vérifiez toutes les modifications avant de sauvegarder.
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
                        <span className="text-gray-600">Prix/jour:</span>
                        <span className="font-medium">{formData.price_per_day} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Localisation:</span>
                        <span className="font-medium">{formData.location}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statut</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut actuel:</span>
                        {originalPublicationStatus && (
                          <VehicleStatusBadge status={originalPublicationStatus} />
                        )}
                      </div>
                      {originalPublicationStatus === 'active' && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                          ⚠️ Le véhicule passera en "En attente de modération" après sauvegarde
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCar;

