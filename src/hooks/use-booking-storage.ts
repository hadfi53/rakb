import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";

interface BookingFormData {
  dateRange?: DateRange;
  pickupLocation?: string;
  returnLocation?: string;
  message?: string;
  insuranceOption?: string;
}

const STORAGE_KEY = "rakeb_booking_draft";

export const useBookingStorage = (vehicleId: string) => {
  const storageKey = `${STORAGE_KEY}_${vehicleId}`;

  const [savedData, setSavedData] = useState<BookingFormData | null>(null);

  // Charger les données sauvegardées
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir les dates strings en Date objects
        if (parsed.dateRange) {
          if (parsed.dateRange.from) {
            parsed.dateRange.from = new Date(parsed.dateRange.from);
          }
          if (parsed.dateRange.to) {
            parsed.dateRange.to = new Date(parsed.dateRange.to);
          }
        }
        setSavedData(parsed);
      }
    } catch (error) {
      console.error("Error loading booking draft:", error);
    }
  }, [storageKey]);

  // Sauvegarder les données
  const saveBookingDraft = useCallback((data: BookingFormData) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSavedData(data);
    } catch (error) {
      console.error("Error saving booking draft:", error);
    }
  }, [storageKey]);

  // Effacer les données sauvegardées
  const clearBookingDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData(null);
    } catch (error) {
      console.error("Error clearing booking draft:", error);
    }
  }, [storageKey]);

  // Auto-sauvegarde avec debounce
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const autoSave = useCallback((data: BookingFormData) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      saveBookingDraft(data);
    }, 1000); // Sauvegarder après 1 seconde d'inactivité
    
    setAutoSaveTimeout(timeout);
  }, [saveBookingDraft, autoSaveTimeout]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  return {
    savedData,
    saveBookingDraft,
    clearBookingDraft,
    autoSave
  };
};
