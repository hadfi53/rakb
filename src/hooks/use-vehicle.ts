import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, VehicleFormData, VehicleSearch, VehicleAvailability, VehiclePublicationStatus } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';
import * as vehiclesBackend from '@/lib/backend/vehicles';

interface UseVehicleProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useVehicle = (props?: UseVehicleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);

  const { onSuccess, onError } = props || {};

  /**
   * Récupère tous les véhicules disponibles avec filtres optionnels
   */
  const getAvailableVehicles = useCallback(async (searchParams?: VehicleSearch) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use backend module
      const { vehicles, error: vehiclesError } = await vehiclesBackend.getAvailableVehicles(searchParams);
      
      if (vehiclesError) {
        throw vehiclesError;
      }
      
      setVehicles(vehicles);
      
      if (onSuccess) onSuccess(vehicles);
      return vehicles;
      
    } catch (err: any) {
      console.error("Erreur lors de la récupération des véhicules:", err);
      const errorMsg = err.message || "Impossible de récupérer les véhicules disponibles";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  /**
   * Récupère les véhicules d'un propriétaire
   */
  const getOwnerVehicles = useCallback(async () => {
    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour accéder à vos véhicules");
      }
      
      setLoading(true);
      setError(null);
      
      // Use backend module
      const { vehicles, error: vehiclesError } = await vehiclesBackend.getOwnerVehicles(user.id);
      
      if (vehiclesError) {
        throw vehiclesError;
      }
      
      setVehicles(vehicles);
      
      if (onSuccess) onSuccess(vehicles);
      return vehicles;
      
    } catch (err: any) {
      console.error("Erreur lors de la récupération des véhicules du propriétaire:", err);
      const errorMsg = err.message || "Impossible de récupérer vos véhicules";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast, onSuccess, onError]);

  /**
   * Récupère les détails d'un véhicule spécifique
   */
  const getVehicleById = useCallback(async (vehicleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use backend module
      const { vehicle, error: vehicleError } = await vehiclesBackend.getVehicleById(vehicleId);
      
      if (vehicleError || !vehicle) {
        throw new Error(vehicleError?.message || "Véhicule non trouvé");
      }
      
      setCurrentVehicle(vehicle);
      
      if (onSuccess) onSuccess(vehicle);
      return vehicle;
      
    } catch (err: any) {
      console.error("Erreur lors de la récupération du véhicule:", err);
      const errorMsg = err.message || "Impossible de récupérer les détails du véhicule";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  /**
   * Crée un nouveau véhicule
   */
  const createVehicle = useCallback(async (vehicleData: VehicleFormData & { publication_status?: VehiclePublicationStatus }) => {
    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour ajouter un véhicule");
      }
      
      setLoading(true);
      setError(null);
      
      console.log("Données véhicule envoyées:", vehicleData);
      
      // Use backend module
      const { vehicle, error: vehicleError } = await vehiclesBackend.createVehicle(user.id, {
        ...vehicleData,
        publication_status: vehicleData.publication_status || 'pending_review',
      });
      
      if (vehicleError || !vehicle) {
        throw new Error(vehicleError?.message || "Impossible d'ajouter le véhicule");
      }
      
      console.log("Véhicule créé:", vehicle);
      
      toast({
        title: "Véhicule ajouté",
        description: "Votre véhicule a été ajouté avec succès",
      });
      
      if (onSuccess) onSuccess(vehicle);
      return vehicle;
      
    } catch (err: any) {
      console.error("Erreur lors de la création du véhicule:", err);
      const errorMsg = err.message || "Impossible d'ajouter le véhicule";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, onSuccess, onError]);

  /**
   * Met à jour un véhicule existant
   */
  const updateVehicle = useCallback(async (vehicleId: string, updates: Partial<VehicleFormData & { publication_status?: VehiclePublicationStatus }>) => {
    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour modifier un véhicule");
      }
      
      setLoading(true);
      setError(null);
      
      // Use backend module (it will check ownership via RLS)
      const { vehicle, error: vehicleError } = await vehiclesBackend.updateVehicle(vehicleId, user.id, updates);
      
      if (vehicleError || !vehicle) {
        throw new Error(vehicleError?.message || "Impossible de mettre à jour le véhicule");
      }
      
      setCurrentVehicle(vehicle);
      
      toast({
        title: "Véhicule mis à jour",
        description: "Votre véhicule a été mis à jour avec succès",
      });
      
      if (onSuccess) onSuccess(vehicle);
      return vehicle;
      
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du véhicule:", err);
      const errorMsg = err.message || "Impossible de mettre à jour le véhicule";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, onSuccess, onError]);

  /**
   * Supprime un véhicule
   */
  const deleteVehicle = useCallback(async (vehicleId: string) => {
    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour supprimer un véhicule");
      }
      
      setLoading(true);
      setError(null);
      
      // Use backend module (it will check ownership via RLS)
      const { error: deleteError } = await vehiclesBackend.deleteVehicle(vehicleId, user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      toast({
        title: "Véhicule supprimé",
        description: "Votre véhicule a été supprimé avec succès",
      });
      
      if (onSuccess) onSuccess({ id: vehicleId });
      return true;
      
    } catch (err: any) {
      console.error("Erreur lors de la suppression du véhicule:", err);
      const errorMsg = err.message || "Impossible de supprimer le véhicule";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, onSuccess, onError]);

  /**
   * Vérifie la disponibilité d'un véhicule pour des dates spécifiques
   */
  const checkVehicleAvailability = useCallback(async (
    vehicleId: string,
    startDate: string,
    endDate: string
  ): Promise<VehicleAvailability> => {
    try {
      setLoading(true);
      
      // Use backend module
      const { available, error: availabilityError } = await vehiclesBackend.checkVehicleAvailability(
        vehicleId,
        startDate,
        endDate
      );
      
      if (availabilityError) {
        throw availabilityError;
      }
      
      return { isAvailable: available };
      
    } catch (err: any) {
      console.error("Erreur lors de la vérification de disponibilité:", err);
      const errorMsg = err.message || "Impossible de vérifier la disponibilité du véhicule";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMsg,
      });
      
      if (onError) onError(err);
      return { isAvailable: false };
    } finally {
      setLoading(false);
    }
  }, [toast, onError]);

  return {
    loading,
    error,
    vehicles,
    currentVehicle,
    getAvailableVehicles,
    getOwnerVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    checkVehicleAvailability
  };
}; 