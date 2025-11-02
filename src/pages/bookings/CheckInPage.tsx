import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Camera, FileCheck, Signature, QrCode, ChevronRight, ChevronLeft, X } from "lucide-react";
import { VehicleChecklist, CheckInOutPhoto, PhotoCategory } from "@/types/booking";
import { mockCheckInOutApi } from "@/lib/mock-checkinout-data";
import { mockBookingApi } from "@/lib/mock-booking-data";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CheckInStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { id: 1, title: "Informations", icon: FileCheck },
  { id: 2, title: "Photos extérieures", icon: Camera },
  { id: 3, title: "Photos intérieures", icon: Camera },
  { id: 4, title: "Checklist", icon: FileCheck },
  { id: 5, title: "Signature", icon: Signature },
  { id: 6, title: "Confirmation", icon: CheckCircle2 },
];

const CheckInPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckInStep>(1);
  const [submitting, setSubmitting] = useState(false);

  // Photos
  const [exteriorPhotos, setExteriorPhotos] = useState<File[]>([]);
  const [interiorPhotos, setInteriorPhotos] = useState<File[]>([]);
  const [odometerPhoto, setOdometerPhoto] = useState<File | null>(null);

  // Checklist
  const [checklist, setChecklist] = useState<VehicleChecklist>({
    fuelLevel: 100,
    odometerReading: 0,
    exterior: {
      body: true,
      paint: true,
      windows: true,
      lights: true,
      tires: true,
    },
    interior: {
      seats: true,
      dashboard: true,
      flooring: true,
      controls: true,
    },
    mechanical: {
      engine: true,
      transmission: true,
      brakes: true,
      steering: true,
    },
    accessories: {
      spareWheel: true,
      jackTools: true,
      firstAidKit: true,
    },
    documents: {
      registration: true,
      insurance: true,
      maintenanceRecords: true,
    },
    damages: [],
    missing: [],
    cleanlinessRating: 5,
    comments: "",
  });

  // Signature
  const [signature, setSignature] = useState<string | null>(null);

  // Load booking
  useEffect(() => {
    const loadBooking = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const bookingData = await mockBookingApi.getBookingById(id);
        
        if (!bookingData) {
          toast({
            variant: "destructive",
            title: "Réservation introuvable",
            description: "Cette réservation n'existe pas",
          });
          navigate('/dashboard/owner/bookings');
          return;
        }

        // Vérifier que c'est bien l'agence propriétaire
        if (bookingData.owner_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Seule l'agence propriétaire peut effectuer le check-in",
          });
          navigate('/dashboard/owner/bookings');
          return;
        }

        // Vérifier que la réservation est confirmée
        if (bookingData.status !== 'confirmed') {
          toast({
            variant: "destructive",
            title: "Réservation non confirmée",
            description: "Le check-in n'est disponible que pour les réservations confirmées",
          });
          navigate(`/bookings/${id}`);
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error("Error loading booking:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la réservation",
        });
        navigate('/dashboard/owner/bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id, user, navigate, toast]);

  const handlePhotoUpload = (
    files: File[],
    category: 'exterior' | 'interior' | 'odometer'
  ) => {
    if (category === 'exterior') {
      setExteriorPhotos([...exteriorPhotos, ...files]);
    } else if (category === 'interior') {
      setInteriorPhotos([...interiorPhotos, ...files]);
    } else {
      setOdometerPhoto(files[0] || null);
    }
  };

  const removePhoto = (
    index: number,
    category: 'exterior' | 'interior' | 'odometer'
  ) => {
    if (category === 'exterior') {
      setExteriorPhotos(exteriorPhotos.filter((_, i) => i !== index));
    } else if (category === 'interior') {
      setInteriorPhotos(interiorPhotos.filter((_, i) => i !== index));
    } else {
      setOdometerPhoto(null);
    }
  };

  const validateStep = (step: CheckInStep): boolean => {
    switch (step) {
      case 1:
        return true; // Informations de base toujours OK
      case 2:
        if (exteriorPhotos.length < 4) {
          toast({
            variant: "destructive",
            title: "Photos insuffisantes",
            description: "Veuillez prendre au moins 4 photos de l'extérieur (avant, arrière, gauche, droite)",
          });
          return false;
        }
        return true;
      case 3:
        if (interiorPhotos.length < 2) {
          toast({
            variant: "destructive",
            title: "Photos insuffisantes",
            description: "Veuillez prendre au moins 2 photos de l'intérieur",
          });
          return false;
        }
        if (!odometerPhoto) {
          toast({
            variant: "destructive",
            title: "Photo manquante",
            description: "Veuillez prendre une photo du compteur kilométrique",
          });
          return false;
        }
        return true;
      case 4:
        // Validation basique - dans un vrai système, on vérifierait tous les éléments
        return true;
      case 5:
        if (!signature) {
          toast({
            variant: "destructive",
            title: "Signature manquante",
            description: "Veuillez signer le formulaire",
          });
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((prev) => (prev + 1) as CheckInStep);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckInStep);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!booking || !user || !validateStep(6)) return;

    try {
      setSubmitting(true);

      // Convertir les photos en format CheckInOutPhoto
      const allPhotos: CheckInOutPhoto[] = [];

      // Photos extérieures
      exteriorPhotos.forEach((file, index) => {
        allPhotos.push({
          id: `ext-${index}`,
          booking_id: booking.id,
          category: 'exterior',
          url: URL.createObjectURL(file),
          taken_at: new Date().toISOString(),
          taken_by: 'owner',
        });
      });

      // Photos intérieures
      interiorPhotos.forEach((file, index) => {
        allPhotos.push({
          id: `int-${index}`,
          booking_id: booking.id,
          category: 'interior',
          url: URL.createObjectURL(file),
          taken_at: new Date().toISOString(),
          taken_by: 'owner',
        });
      });

      // Photo compteur
      if (odometerPhoto) {
        allPhotos.push({
          id: 'odo',
          booking_id: booking.id,
          category: 'odometer',
          url: URL.createObjectURL(odometerPhoto),
          taken_at: new Date().toISOString(),
          taken_by: 'owner',
        });
      }

      // Soumettre le check-in
      await mockCheckInOutApi.submitCheckIn(
        booking.id,
        user.id,
        checklist,
        allPhotos,
        signature || undefined,
        checklist.comments
      );

      toast({
        title: "Check-in complété !",
        description: "Le check-in a été enregistré avec succès",
      });

      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      console.error("Error submitting check-in:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de compléter le check-in. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const progress = (currentStep / 6) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/bookings/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la réservation
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Check-in du véhicule</h1>
            <p className="text-gray-600 mt-2">
              État des lieux à la remise du véhicule
            </p>
          </div>
        </div>

        {/* Progress */}
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
            {/* Step 1: Informations */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    <strong>Informations de la réservation :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Client: {booking.renter?.first_name} {booking.renter?.last_name}</li>
                      <li>Dates: {new Date(booking.start_date).toLocaleDateString('fr-FR')} - {new Date(booking.end_date).toLocaleDateString('fr-FR')}</li>
                      <li>Lieu de récupération: {booking.pickup_location}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <div>
                    <Label>Kilométrage actuel</Label>
                    <Input
                      type="number"
                      value={checklist.odometerReading || ''}
                      onChange={(e) => setChecklist({
                        ...checklist,
                        odometerReading: parseInt(e.target.value) || 0
                      })}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div>
                    <Label>Niveau de carburant (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={checklist.fuelLevel || ''}
                      onChange={(e) => setChecklist({
                        ...checklist,
                        fuelLevel: parseInt(e.target.value) || 0
                      })}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Photos extérieures */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Prenez au moins 4 photos de l'extérieur du véhicule : vue avant, arrière, côté gauche, côté droit.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>Photos extérieures ({exteriorPhotos.length})</Label>
                  <div className="mt-4 space-y-4">
                    {exteriorPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {exteriorPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Exterior ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index, 'exterior')}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handlePhotoUpload(Array.from(e.target.files), 'exterior');
                          }
                        }}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" className="w-full" as="span">
                        <Camera className="w-4 h-4 mr-2" />
                        {exteriorPhotos.length === 0 ? 'Prendre des photos' : 'Ajouter des photos'}
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos intérieures */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Prenez au moins 2 photos de l'intérieur et une photo du compteur kilométrique.
                  </AlertDescription>
                </Alert>
                <div className="space-y-6">
                  <div>
                    <Label>Photos intérieures ({interiorPhotos.length})</Label>
                    <div className="mt-4 space-y-4">
                      {interiorPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {interiorPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Interior ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index, 'interior')}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              handlePhotoUpload(Array.from(e.target.files), 'interior');
                            }
                          }}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" className="w-full" as="span">
                          <Camera className="w-4 h-4 mr-2" />
                          {interiorPhotos.length === 0 ? 'Prendre des photos intérieures' : 'Ajouter des photos'}
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Photo du compteur kilométrique</Label>
                    <div className="mt-4 space-y-4">
                      {odometerPhoto && (
                        <div className="relative w-full max-w-xs">
                          <img
                            src={URL.createObjectURL(odometerPhoto)}
                            alt="Odometer"
                            className="w-full h-48 object-contain rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(0, 'odometer')}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {!odometerPhoto && (
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePhotoUpload([e.target.files[0]], 'odometer');
                              }
                            }}
                            className="hidden"
                          />
                          <Button type="button" variant="outline" className="w-full" as="span">
                            <Camera className="w-4 h-4 mr-2" />
                            Prendre une photo du compteur
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Checklist */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Extérieur */}
                  <div>
                    <h3 className="font-semibold mb-4">État extérieur</h3>
                    <div className="space-y-3">
                      {Object.entries(checklist.exterior).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="capitalize">{key}</Label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setChecklist({
                              ...checklist,
                              exterior: {
                                ...checklist.exterior,
                                [key]: e.target.checked
                              }
                            })}
                            className="w-5 h-5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intérieur */}
                  <div>
                    <h3 className="font-semibold mb-4">État intérieur</h3>
                    <div className="space-y-3">
                      {Object.entries(checklist.interior).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="capitalize">{key}</Label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setChecklist({
                              ...checklist,
                              interior: {
                                ...checklist.interior,
                                [key]: e.target.checked
                              }
                            })}
                            className="w-5 h-5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mécanique */}
                  <div>
                    <h3 className="font-semibold mb-4">État mécanique</h3>
                    <div className="space-y-3">
                      {Object.entries(checklist.mechanical).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="capitalize">{key}</Label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setChecklist({
                              ...checklist,
                              mechanical: {
                                ...checklist.mechanical,
                                [key]: e.target.checked
                              }
                            })}
                            className="w-5 h-5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessoires */}
                  <div>
                    <h3 className="font-semibold mb-4">Accessoires</h3>
                    <div className="space-y-3">
                      {Object.entries(checklist.accessories).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setChecklist({
                              ...checklist,
                              accessories: {
                                ...checklist.accessories,
                                [key]: e.target.checked
                              }
                            })}
                            className="w-5 h-5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Niveau de propreté */}
                <div>
                  <Label>Niveau de propreté (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={checklist.cleanlinessRating || ''}
                    onChange={(e) => setChecklist({
                      ...checklist,
                      cleanlinessRating: parseInt(e.target.value) || 5
                    })}
                    className="mt-2"
                  />
                </div>

                {/* Commentaires */}
                <div>
                  <Label>Commentaires (optionnel)</Label>
                  <Textarea
                    value={checklist.comments || ''}
                    onChange={(e) => setChecklist({
                      ...checklist,
                      comments: e.target.value
                    })}
                    placeholder="Notes supplémentaires..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Signature */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Signez numériquement pour confirmer l'état des lieux. Dans un vrai système, cela utiliserait un canvas de signature.
                  </AlertDescription>
                </Alert>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Signature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Zone de signature</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Dans un vrai système, on ouvrirait un canvas de signature
                      // Pour l'instant, on simule avec un texte
                      setSignature(`data:image/png;base64,signature-${Date.now()}`);
                      toast({
                        title: "Signature enregistrée",
                        description: "Votre signature a été capturée",
                      });
                    }}
                  >
                    {signature ? "Signature capturée ✓" : "Signer"}
                  </Button>
                  {signature && (
                    <p className="text-sm text-green-600 mt-2">✓ Signature enregistrée</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Résumé du check-in</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{exteriorPhotos.length} photos extérieures</li>
                      <li>{interiorPhotos.length} photos intérieures</li>
                      <li>Photo du compteur: {odometerPhoto ? "✓" : "✗"}</li>
                      <li>Kilométrage: {checklist.odometerReading} km</li>
                      <li>Carburant: {checklist.fuelLevel}%</li>
                      <li>Signature: {signature ? "✓" : "✗"}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600">
                  Vérifiez toutes les informations avant de finaliser le check-in.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
          
          {currentStep < 6 ? (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {submitting ? "Enregistrement..." : "Finaliser le check-in"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;

