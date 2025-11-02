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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, Camera, FileCheck, Signature, AlertTriangle, DollarSign, ChevronRight, ChevronLeft, X, Plus } from "lucide-react";
import { VehicleChecklist, CheckInOutPhoto, DamageItem } from "@/types/booking";
import { mockCheckInOutApi } from "@/lib/mock-checkinout-data";
import { mockBookingApi } from "@/lib/mock-booking-data";

type CheckOutStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEPS = [
  { id: 1, title: "Informations", icon: FileCheck },
  { id: 2, title: "Photos extérieures", icon: Camera },
  { id: 3, title: "Photos intérieures", icon: Camera },
  { id: 4, title: "Checklist & Dommages", icon: FileCheck },
  { id: 5, title: "Comparaison", icon: AlertTriangle },
  { id: 6, title: "Signature", icon: Signature },
  { id: 7, title: "Confirmation", icon: CheckCircle2 },
];

const CheckOutPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckOutStep>(1);
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

  // Additional charges
  const [additionalCharges, setAdditionalCharges] = useState({
    fuelPenalty: 0,
    mileagePenalty: 0,
    damagePenalty: 0,
    cleaningFee: 0,
    otherFees: 0,
    total: 0,
  });

  // Signature
  const [signature, setSignature] = useState<string | null>(null);

  // Load booking and check-in
  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const [bookingData, checkInData] = await Promise.all([
          mockBookingApi.getBookingById(id),
          mockCheckInOutApi.getCheckIn(id),
        ]);
        
        if (!bookingData) {
          toast({
            variant: "destructive",
            title: "Réservation introuvable",
            description: "Cette réservation n'existe pas",
          });
          navigate('/dashboard/renter/bookings');
          return;
        }

        // Vérifier que c'est bien le locataire
        if (bookingData.renter_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Seul le locataire peut effectuer le check-out",
          });
          navigate('/dashboard/renter/bookings');
          return;
        }

        // Vérifier que la réservation est en cours
        if (bookingData.status !== 'in_progress') {
          toast({
            variant: "destructive",
            title: "Réservation non disponible",
            description: "Le check-out n'est disponible que pour les réservations en cours",
          });
          navigate(`/bookings/${id}`);
          return;
        }

        setBooking(bookingData);
        setCheckIn(checkInData);

        // Pré-remplir avec les valeurs du check-in si disponibles
        if (checkInData) {
          setChecklist({
            ...checklist,
            odometerReading: checkInData.checklist.odometerReading || 0,
            fuelLevel: checkInData.checklist.fuelLevel || 100,
          });
        }
      } catch (err) {
        console.error("Error loading data:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données",
        });
        navigate('/dashboard/renter/bookings');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate, toast]);

  // Calculate comparison when reaching step 5
  useEffect(() => {
    const calculateComparison = async () => {
      if (currentStep === 5 && checkIn && booking) {
        try {
          const comp = await mockCheckInOutApi.compareCheckInOut(id!);
          setComparison(comp);

          // Calculate additional charges
          const fuelDiff = (comp.fuelDifference < 0) ? Math.abs(comp.fuelDifference) : 0;
          const fuelPenalty = fuelDiff > 10 ? fuelDiff * 5 : 0; // 5 MAD per % if more than 10% difference

          const mileagePenalty = comp.mileageDifference > (comp.mileageDifference * 0.2) ? 100 : 0; // 100 MAD if excessive mileage
          
          const damagePenalty = comp.damages.length * 500; // 500 MAD per damage
          
          const cleaningFee = comp.cleanlinessChange < -2 ? 200 : 0; // 200 MAD if cleanliness dropped significantly

          const total = fuelPenalty + mileagePenalty + damagePenalty + cleaningFee;

          setAdditionalCharges({
            fuelPenalty,
            mileagePenalty,
            damagePenalty,
            cleaningFee,
            otherFees: 0,
            total,
          });
        } catch (err) {
          console.error("Error calculating comparison:", err);
        }
      }
    };

    calculateComparison();
  }, [currentStep, checkIn, booking, id]);

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

  const addDamage = () => {
    const newDamage: DamageItem = {
      id: `damage-${Date.now()}`,
      location: '',
      description: '',
      severity: 'minor',
    };
    setChecklist({
      ...checklist,
      damages: [...checklist.damages, newDamage],
    });
  };

  const updateDamage = (index: number, updates: Partial<DamageItem>) => {
    const newDamages = [...checklist.damages];
    newDamages[index] = { ...newDamages[index], ...updates };
    setChecklist({
      ...checklist,
      damages: newDamages,
    });
  };

  const removeDamage = (index: number) => {
    setChecklist({
      ...checklist,
      damages: checklist.damages.filter((_, i) => i !== index),
    });
  };

  const validateStep = (step: CheckOutStep): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        if (exteriorPhotos.length < 4) {
          toast({
            variant: "destructive",
            title: "Photos insuffisantes",
            description: "Veuillez prendre au moins 4 photos de l'extérieur",
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
        return true; // Checklist validation
      case 5:
        return true; // Comparison is informational
      case 6:
        if (!signature) {
          toast({
            variant: "destructive",
            title: "Signature manquante",
            description: "Veuillez signer le formulaire",
          });
          return false;
        }
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
        setCurrentStep((prev) => (prev + 1) as CheckOutStep);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckOutStep);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!booking || !user || !validateStep(7)) return;

    try {
      setSubmitting(true);

      // Convertir les photos
      const allPhotos: CheckInOutPhoto[] = [];

      exteriorPhotos.forEach((file, index) => {
        allPhotos.push({
          id: `ext-${index}`,
          booking_id: booking.id,
          category: 'exterior',
          url: URL.createObjectURL(file),
          taken_at: new Date().toISOString(),
          taken_by: 'renter',
        });
      });

      interiorPhotos.forEach((file, index) => {
        allPhotos.push({
          id: `int-${index}`,
          booking_id: booking.id,
          category: 'interior',
          url: URL.createObjectURL(file),
          taken_at: new Date().toISOString(),
          taken_by: 'renter',
        });
      });

      if (odometerPhoto) {
        allPhotos.push({
          id: 'odo',
          booking_id: booking.id,
          category: 'odometer',
          url: URL.createObjectURL(odometerPhoto),
          taken_at: new Date().toISOString(),
          taken_by: 'renter',
        });
      }

      // Soumettre le check-out
      await mockCheckInOutApi.submitCheckOut(
        booking.id,
        user.id,
        checklist,
        allPhotos,
        signature || undefined,
        checklist.comments
      );

      toast({
        title: "Check-out complété !",
        description: additionalCharges.total > 0
          ? `Des frais supplémentaires de ${additionalCharges.total} MAD ont été calculés`
          : "Le check-out a été enregistré avec succès",
      });

      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      console.error("Error submitting check-out:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de compléter le check-out. Veuillez réessayer.",
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

  const progress = (currentStep / 7) * 100;

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
            <h1 className="text-3xl font-bold text-gray-900">Check-out du véhicule</h1>
            <p className="text-gray-600 mt-2">
              État des lieux au retour du véhicule
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
                      <li>Dates: {new Date(booking.start_date).toLocaleDateString('fr-FR')} - {new Date(booking.end_date).toLocaleDateString('fr-FR')}</li>
                      <li>Lieu de retour: {booking.return_location || booking.pickup_location}</li>
                      {checkIn && (
                        <>
                          <li>Kilométrage au départ: {checkIn.checklist.odometerReading} km</li>
                          <li>Carburant au départ: {checkIn.checklist.fuelLevel}%</li>
                        </>
                      )}
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
                      placeholder="Ex: 50100"
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
                      placeholder="Ex: 80"
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
                    Prenez au moins 4 photos de l'extérieur du véhicule pour documenter l'état actuel.
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

            {/* Step 4: Checklist & Dommages */}
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
                </div>

                {/* Dommages */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Dommages constatés</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addDamage}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un dommage
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {checklist.damages.map((damage, index) => (
                      <Card key={damage.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <Label>Emplacement</Label>
                              <Input
                                value={damage.location}
                                onChange={(e) => updateDamage(index, { location: e.target.value })}
                                placeholder="Ex: Portière avant droite"
                              />
                            </div>
                            <div>
                              <Label>Gravité</Label>
                              <select
                                value={damage.severity}
                                onChange={(e) => updateDamage(index, { severity: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              >
                                <option value="minor">Mineur</option>
                                <option value="moderate">Modéré</option>
                                <option value="major">Majeur</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeDamage(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={damage.description}
                              onChange={(e) => updateDamage(index, { description: e.target.value })}
                              placeholder="Décrivez le dommage..."
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {checklist.damages.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun dommage constaté
                      </p>
                    )}
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

            {/* Step 5: Comparaison */}
            {currentStep === 5 && checkIn && comparison && (
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="w-5 h-5" />
                  <AlertTitle>Comparaison avec le check-in</AlertTitle>
                  <AlertDescription>
                    Voici les différences constatées entre le départ et le retour
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Kilométrage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Au départ: {checkIn.checklist.odometerReading} km</p>
                        <p className="text-sm text-gray-600">Au retour: {checklist.odometerReading} km</p>
                        <p className="font-medium">
                          Différence: {comparison.mileageDifference} km
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Carburant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Au départ: {checkIn.checklist.fuelLevel}%</p>
                        <p className="text-sm text-gray-600">Au retour: {checklist.fuelLevel}%</p>
                        <p className={`font-medium ${comparison.fuelDifference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Différence: {comparison.fuelDifference > 0 ? '+' : ''}{comparison.fuelDifference}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {comparison.damages.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-900">Dommages constatés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {comparison.damages.map((damage: DamageItem, idx: number) => (
                          <li key={idx} className="text-red-800">
                            {damage.location}: {damage.description} ({damage.severity})
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {additionalCharges.total > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Frais supplémentaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {additionalCharges.fuelPenalty > 0 && (
                          <div className="flex justify-between">
                            <span>Pénalité carburant:</span>
                            <span className="font-medium">{additionalCharges.fuelPenalty} MAD</span>
                          </div>
                        )}
                        {additionalCharges.mileagePenalty > 0 && (
                          <div className="flex justify-between">
                            <span>Pénalité kilométrage:</span>
                            <span className="font-medium">{additionalCharges.mileagePenalty} MAD</span>
                          </div>
                        )}
                        {additionalCharges.damagePenalty > 0 && (
                          <div className="flex justify-between">
                            <span>Frais de dommages:</span>
                            <span className="font-medium">{additionalCharges.damagePenalty} MAD</span>
                          </div>
                        )}
                        {additionalCharges.cleaningFee > 0 && (
                          <div className="flex justify-between">
                            <span>Frais de nettoyage:</span>
                            <span className="font-medium">{additionalCharges.cleaningFee} MAD</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-orange-200 font-bold text-lg">
                          <span>Total:</span>
                          <span>{additionalCharges.total} MAD</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {additionalCharges.total === 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Aucun frais supplémentaire</strong>
                      <p className="mt-1">Le véhicule est dans l'état prévu. Merci !</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 6: Signature */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Signez numériquement pour confirmer l'état des lieux et accepter les frais supplémentaires éventuels.
                  </AlertDescription>
                </Alert>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Signature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Zone de signature</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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

            {/* Step 7: Confirmation */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Résumé du check-out</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{exteriorPhotos.length} photos extérieures</li>
                      <li>{interiorPhotos.length} photos intérieures</li>
                      <li>Photo du compteur: {odometerPhoto ? "✓" : "✗"}</li>
                      <li>Kilométrage: {checklist.odometerReading} km</li>
                      <li>Carburant: {checklist.fuelLevel}%</li>
                      <li>Dommages: {checklist.damages.length}</li>
                      <li>Signature: {signature ? "✓" : "✗"}</li>
                      {additionalCharges.total > 0 && (
                        <li className="font-bold">Frais supplémentaires: {additionalCharges.total} MAD</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600">
                  Vérifiez toutes les informations avant de finaliser le check-out.
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
          
          {currentStep < 7 ? (
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
              {submitting ? "Enregistrement..." : "Finaliser le check-out"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckOutPage;

