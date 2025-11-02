import { useState, useRef } from 'react';
import { Camera, X, Upload, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleChecklist as VehicleChecklistType } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  AlertCircle, 
  CheckCircle, 
  Fuel, 
  Trash, 
  Plus, 
  Car, 
  Sofa, 
  Wrench, 
  Package, 
  FileText 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface VehicleChecklistProps {
  bookingId: string;
  vehicleId: string;
  initialData?: VehicleChecklistType;
  isReadOnly?: boolean;
  onSave?: (checklist: VehicleChecklistType, photos: string[]) => void;
  onCancel?: () => void;
}

// Crée une checklist vide avec toutes les valeurs par défaut
const createEmptyChecklist = (): VehicleChecklistType => ({
  exterior: {
    front: false,
    rear: false,
    leftSide: false,
    rightSide: false,
    roof: false,
    damages: [],
  },
  interior: {
    seats: false,
    dashboard: false,
    trunk: false,
    damages: [],
  },
  mechanical: {
    engine: false,
    transmission: false,
    brakes: false,
    steering: false,
    issues: [],
  },
  fluids: {
    fuel: 50, // Pourcentage par défaut à 50%
    oil: false,
    brake: false,
    windshield: false,
  },
  documents: {
    registration: false,
    insurance: false,
    inspection: false,
  },
  accessories: {
    spareWheel: false,
    jackAndTools: false,
    firstAidKit: false,
    safetyVest: false,
    extras: [],
  },
});

export const VehicleChecklistForm = ({
  bookingId,
  vehicleId,
  initialData,
  isReadOnly = false,
  onSave,
  onCancel,
}: VehicleChecklistProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('exterior');
  const [checklist, setChecklist] = useState<VehicleChecklistType>(
    initialData || createEmptyChecklist()
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newIssue, setNewIssue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [newDamage, setNewDamage] = useState({ location: '', description: '', severity: 'minor' as const });
  const [newMissingItem, setNewMissingItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Vérifier la complétude de la checklist
  const checkCompleteness = () => {
    const exterior = checklist.exterior.front && 
                    checklist.exterior.rear && 
                    checklist.exterior.leftSide && 
                    checklist.exterior.rightSide;
    
    const interior = checklist.interior.seats && 
                     checklist.interior.dashboard;
    
    const mechanical = checklist.mechanical.engine && 
                       checklist.mechanical.brakes;
    
    const documents = checklist.documents.registration && 
                      checklist.documents.insurance;
    
    const complete = exterior && interior && mechanical && documents;
    
    setIsComplete(complete);
    return complete;
  };

  // Mettre à jour un champ booléen dans la checklist
  const handleCheckboxChange = (section: keyof VehicleChecklistType, field: string, value: boolean) => {
    if (isReadOnly) return;
    
    setChecklist((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    
    setTimeout(checkCompleteness, 0);
  };

  // Mettre à jour le niveau de carburant
  const handleFuelChange = (value: string) => {
    if (isReadOnly) return;
    
    const fuelLevel = parseInt(value);
    setChecklist((prev) => ({
      ...prev,
      fluids: {
        ...prev.fluids,
        fuel: isNaN(fuelLevel) ? 0 : Math.max(0, Math.min(100, fuelLevel)),
      },
    }));
  };

  // Ajouter un élément à une liste (dommages, problèmes, extras)
  const handleAddItem = (section: keyof VehicleChecklistType, listField: string) => {
    if (isReadOnly || !newIssue.trim()) return;
    
    setChecklist((prev) => {
      const currentList = prev[section][listField] as string[];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [listField]: [...currentList, newIssue.trim()],
        },
      };
    });
    
    setNewIssue('');
  };

  // Supprimer un élément d'une liste
  const handleRemoveItem = (section: keyof VehicleChecklistType, listField: string, index: number) => {
    if (isReadOnly) return;
    
    setChecklist((prev) => {
      const currentList = [...prev[section][listField]] as string[];
      currentList.splice(index, 1);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [listField]: currentList,
        },
      };
    });
  };

  // Gérer l'upload des photos
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !event.target.files?.length) return;
    
    setUploadingPhotos(true);
    
    try {
      const files = Array.from(event.target.files);
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${bookingId}_${Date.now()}.${fileExt}`;
        const filePath = `bookings/${bookingId}/photos/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('vehicle-photos')
          .upload(filePath, file);
        
        if (error) {
          throw error;
        }
        
        const { data: urlData } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(urlData.publicUrl);
      }
      
      setPhotos((prev) => [...prev, ...uploadedUrls]);
      
      toast({
        title: "Photos ajoutées",
        description: `${uploadedUrls.length} photo(s) ajoutée(s) avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'upload",
        description: error.message || "Une erreur est survenue lors de l'upload des photos.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Supprimer une photo
  const handleRemovePhoto = (url: string) => {
    if (isReadOnly) return;
    
    setPhotos((prev) => prev.filter((photoUrl) => photoUrl !== url));
  };

  // Soumettre la checklist et les photos
  const handleSubmit = () => {
    if (!checkCompleteness()) {
      toast({
        title: "Checklist incomplète",
        description: "Veuillez remplir toutes les sections obligatoires avant de soumettre.",
        variant: "destructive",
      });
      return;
    }
    
    if (onSave) {
      onSave(checklist, photos);
    }
  };

  // Gérer le changement de niveau de carburant
  const handleFuelLevelChange = (value: number[]) => {
    setChecklist(prev => ({
      ...prev,
      fluids: {
        ...prev.fluids,
        fuel: value[0]
      }
    }));
  };

  // Ajouter un nouveau dommage
  const handleAddDamage = () => {
    if (!newDamage.location || !newDamage.description) {
      toast({
        title: 'Information manquante',
        description: 'Veuillez saisir l\'emplacement et la description du dommage.',
        variant: 'destructive',
      });
      return;
    }
    
    const damage: DamageItem = {
      id: uuidv4(),
      location: newDamage.location,
      description: newDamage.description,
      severity: newDamage.severity,
      photoUrls: []
    };
    
    setChecklist(prev => ({
      ...prev,
      damages: [...prev.damages, damage]
    }));
    
    setNewDamage({ location: '', description: '', severity: 'minor' });
  };

  // Supprimer un dommage
  const handleRemoveDamage = (id: string) => {
    setChecklist(prev => ({
      ...prev,
      damages: prev.damages.filter(d => d.id !== id)
    }));
  };

  // Ajouter un élément manquant
  const handleAddMissingItem = () => {
    if (!newMissingItem.trim()) {
      toast({
        title: 'Information manquante',
        description: 'Veuillez saisir le nom de l\'élément manquant.',
        variant: 'destructive',
      });
      return;
    }
    
    setChecklist(prev => ({
      ...prev,
      missing: [...prev.missing, newMissingItem.trim()]
    }));
    
    setNewMissingItem('');
  };

  // Supprimer un élément manquant
  const handleRemoveMissingItem = (item: string) => {
    setChecklist(prev => ({
      ...prev,
      missing: prev.missing.filter(i => i !== item)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">État des lieux</h2>
        {isReadOnly && (
          <Badge variant="outline" className="text-sm">
            Mode lecture seule
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="exterior">
            <Car className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Extérieur</span>
          </TabsTrigger>
          <TabsTrigger value="interior">
            <Sofa className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Intérieur</span>
          </TabsTrigger>
          <TabsTrigger value="mechanical">
            <Wrench className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Mécanique</span>
          </TabsTrigger>
          <TabsTrigger value="accessories">
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Accessoires</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="damages">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Problèmes</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Extérieur */}
        <TabsContent value="exterior">
          <Card>
            <CardHeader>
              <CardTitle>Extérieur du véhicule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kilométrage */}
              <div className="space-y-2">
                <Label htmlFor="odometerReading">Kilométrage actuel (km)</Label>
                <Input 
                  type="number" 
                  id="odometerReading" 
                  value={checklist.odometerReading} 
                  onChange={(e) => setChecklist(prev => ({
                    ...prev,
                    odometerReading: parseInt(e.target.value) || 0
                  }))}
                  disabled={isReadOnly}
                  required
                />
              </div>
              
              {/* Niveau de carburant */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Niveau de carburant</Label>
                  <div className="flex items-center space-x-1">
                    <Fuel className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{checklist.fluids.fuel}%</span>
                  </div>
                </div>
                <Slider
                  onValueChange={handleFuelLevelChange}
                  value={[checklist.fluids.fuel]}
                  max={100}
                  step={5}
                  disabled={isReadOnly}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Vide</span>
                  <span>1/4</span>
                  <span>1/2</span>
                  <span>3/4</span>
                  <span>Plein</span>
                </div>
              </div>
              
              {/* Checklist extérieur */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Vérification de l'état extérieur</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exterior-front" 
                      checked={checklist.exterior.front} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('exterior', 'front', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="exterior-front" className="cursor-pointer">Avant du véhicule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exterior-rear" 
                      checked={checklist.exterior.rear} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('exterior', 'rear', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="exterior-rear" className="cursor-pointer">Arrière du véhicule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exterior-left" 
                      checked={checklist.exterior.leftSide} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('exterior', 'leftSide', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="exterior-left" className="cursor-pointer">Côté gauche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exterior-right" 
                      checked={checklist.exterior.rightSide} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('exterior', 'rightSide', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="exterior-right" className="cursor-pointer">Côté droit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exterior-roof" 
                      checked={checklist.exterior.roof} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('exterior', 'roof', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="exterior-roof" className="cursor-pointer">Toit</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Intérieur */}
        <TabsContent value="interior">
          <Card>
            <CardHeader>
              <CardTitle>Intérieur du véhicule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-sm font-medium">Vérification de l'état intérieur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="interior-seats" 
                    checked={checklist.interior.seats} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('interior', 'seats', checked as boolean)
                    }
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="interior-seats" className="cursor-pointer">Sièges en bon état</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="interior-dashboard" 
                    checked={checklist.interior.dashboard} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('interior', 'dashboard', checked as boolean)
                    }
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="interior-dashboard" className="cursor-pointer">Tableau de bord fonctionnel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="interior-trunk" 
                    checked={checklist.interior.trunk} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('interior', 'trunk', checked as boolean)
                    }
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="interior-trunk" className="cursor-pointer">Coffre</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mécanique */}
        <TabsContent value="mechanical">
          <Card>
            <CardHeader>
              <CardTitle>État mécanique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Vérification de l'état mécanique</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mechanical-engine" 
                      checked={checklist.mechanical.engine} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('mechanical', 'engine', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="mechanical-engine" className="cursor-pointer">Moteur fonctionne correctement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mechanical-transmission" 
                      checked={checklist.mechanical.transmission} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('mechanical', 'transmission', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="mechanical-transmission" className="cursor-pointer">Transmission fonctionne bien</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mechanical-brakes" 
                      checked={checklist.mechanical.brakes} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('mechanical', 'brakes', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="mechanical-brakes" className="cursor-pointer">Freins en bon état</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mechanical-steering" 
                      checked={checklist.mechanical.steering} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('mechanical', 'steering', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="mechanical-steering" className="cursor-pointer">Direction réactive</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Accessoires */}
        <TabsContent value="accessories">
          <Card>
            <CardHeader>
              <CardTitle>Accessoires et équipements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Vérification des accessoires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="accessories-spareWheel" 
                      checked={checklist.accessories.spareWheel} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('accessories', 'spareWheel', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="accessories-spareWheel" className="cursor-pointer">Roue de secours présente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="accessories-jackTools" 
                      checked={checklist.accessories.jackAndTools} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('accessories', 'jackAndTools', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="accessories-jackTools" className="cursor-pointer">Cric et outils</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="accessories-firstAidKit" 
                      checked={checklist.accessories.firstAidKit} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('accessories', 'firstAidKit', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="accessories-firstAidKit" className="cursor-pointer">Trousse de premiers secours</Label>
                  </div>
                </div>
                
                {/* Éléments manquants */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Éléments manquants</h3>
                  {checklist.missing && checklist.missing.length > 0 ? (
                    <div className="space-y-2">
                      {checklist.missing.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                          <span>{item}</span>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMissingItem(item)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun élément manquant signalé.</p>
                  )}
                  
                  {!isReadOnly && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nom de l'élément manquant"
                        value={newMissingItem}
                        onChange={(e) => setNewMissingItem(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleAddMissingItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents du véhicule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Vérification des documents</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="documents-registration" 
                      checked={checklist.documents.registration} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('documents', 'registration', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="documents-registration" className="cursor-pointer">Carte grise présente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="documents-insurance" 
                      checked={checklist.documents.insurance} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('documents', 'insurance', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="documents-insurance" className="cursor-pointer">Attestation d'assurance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="documents-inspection" 
                      checked={checklist.documents.inspection} 
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('documents', 'inspection', checked as boolean)
                      }
                      disabled={isReadOnly}
                    />
                    <Label htmlFor="documents-inspection" className="cursor-pointer">Contrôle technique</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Dommages */}
        <TabsContent value="damages">
          <Card>
            <CardHeader>
              <CardTitle>Dommages et problèmes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Liste des dommages */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Dommages constatés</h3>
                {checklist.damages && checklist.damages.length > 0 ? (
                  <div className="space-y-4">
                    {checklist.damages.map((damage) => (
                      <div key={damage.id} className="border rounded-md p-3 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{damage.location}</p>
                            <p className="text-sm text-muted-foreground">{damage.description}</p>
                            <div className="mt-1">
                              <Badge variant={
                                damage.severity === 'minor' ? 'outline' : 
                                damage.severity === 'moderate' ? 'secondary' : 'destructive'
                              }>
                                {damage.severity === 'minor' ? 'Mineur' : 
                                 damage.severity === 'moderate' ? 'Moyen' : 'Important'}
                              </Badge>
                            </div>
                          </div>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDamage(damage.id)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        {damage.photoUrls && damage.photoUrls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {damage.photoUrls.map((url, idx) => (
                              <img 
                                key={idx} 
                                src={url} 
                                alt={`Dommage ${damage.location}`} 
                                className="h-20 w-20 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun dommage signalé.</p>
                )}
                
                {/* Ajouter un dommage */}
                {!isReadOnly && (
                  <div className="border rounded-md p-4 mt-4 space-y-4">
                    <h3 className="text-sm font-medium">Ajouter un dommage</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="damage-location">Emplacement</Label>
                        <Input
                          id="damage-location"
                          placeholder="Ex: Portière avant gauche"
                          value={newDamage.location}
                          onChange={(e) => setNewDamage(prev => ({...prev, location: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="damage-description">Description</Label>
                        <Textarea
                          id="damage-description"
                          placeholder="Décrivez le dommage..."
                          value={newDamage.description}
                          onChange={(e) => setNewDamage(prev => ({...prev, description: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="damage-severity">Gravité</Label>
                        <Select
                          value={newDamage.severity}
                          onValueChange={(value: 'minor' | 'moderate' | 'major') => 
                            setNewDamage(prev => ({...prev, severity: value}))
                          }
                        >
                          <SelectTrigger id="damage-severity">
                            <SelectValue placeholder="Sélectionnez la gravité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Mineur</SelectItem>
                            <SelectItem value="moderate">Moyen</SelectItem>
                            <SelectItem value="major">Important</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="secondary" onClick={handleAddDamage} className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter ce dommage
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Photos du véhicule */}
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium">Photos du véhicule</h3>
                
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Photo ${index + 1}`} 
                          className="h-32 w-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune photo téléchargée.</p>
                )}
                
                {!isReadOnly && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhotos}
                      className="w-full"
                    >
                      {uploadingPhotos ? (
                        <>Téléchargement en cours...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger des photos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Annuler
          </Button>
        )}
        {onSave && !isReadOnly && (
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              'Enregistrement...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enregistrer l'état des lieux
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}; 