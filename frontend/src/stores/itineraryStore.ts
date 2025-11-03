import { create } from 'zustand';
import { Itinerary } from '../types';
import { getItineraries, getItinerary, deleteItinerary, saveItinerary } from '../services/itinerary';

interface ItineraryState {
  itineraries: Itinerary[];
  currentItinerary: Itinerary | null;
  isLoading: boolean;
  
  // Actions
  fetchItineraries: () => Promise<void>;
  fetchItinerary: (id: string) => Promise<void>;
  saveItinerary: (itinerary: Itinerary) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;
}

export const useItineraryStore = create<ItineraryState>((set) => ({
  itineraries: [],
  currentItinerary: null,
  isLoading: false,
  
  fetchItineraries: async () => {
    set({ isLoading: true });
    try {
      const itineraries = await getItineraries();
      set({ itineraries, isLoading: false });
    } catch (error) {
      console.error('Fetch itineraries error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  fetchItinerary: async (id: string) => {
    set({ isLoading: true });
    try {
      const itinerary = await getItinerary(id);
      set({ currentItinerary: itinerary, isLoading: false });
    } catch (error) {
      console.error('Fetch itinerary error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  saveItinerary: async (itinerary: Itinerary) => {
    try {
      await saveItinerary(itinerary);
    } catch (error) {
      console.error('Save itinerary error:', error);
      throw error;
    }
  },
  
  deleteItinerary: async (id: string) => {
    try {
      await deleteItinerary(id);
      set((state) => ({
        itineraries: state.itineraries.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Delete itinerary error:', error);
      throw error;
    }
  },
  
  setCurrentItinerary: (itinerary: Itinerary | null) => {
    set({ currentItinerary: itinerary });
  },
}));

