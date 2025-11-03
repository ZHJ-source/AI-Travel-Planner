// 与后端保持一致的类型定义

export interface Location {
  lat: number;
  lng: number;
}

export type EventType = 'attraction' | 'restaurant' | 'hotel' | 'transportation' | 'entertainment' | 'shopping';

export interface Event {
  id?: string;
  dayId?: string;
  parentEventId?: string | null;
  eventOrder: number;
  type: EventType;
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  locationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  poiId?: string;
  images?: string[];
  tips?: string;
  isMainEvent: boolean;
  subEvents?: Event[];
}

export interface ItineraryDay {
  id?: string;
  dayNumber: number;
  date?: string;
  events: Event[];
  notes?: string;
}

export interface Itinerary {
  id?: string;
  userId?: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  days: ItineraryDay[];
  travelers?: number;
  budget?: number;
  preferences?: string[];
  status?: 'draft' | 'confirmed' | 'completed';
  transportation?: {
    type: string;
    details: string;
    estimatedCost: number;
  };
  accommodation?: {
    type: string;
    details: string;
    estimatedCost: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface TravelRequirements {
  destination: string;
  days: number;
  budget?: number;
  travelers?: number;
  preferences?: string[];
  specialNeeds?: string[];
  startDate?: string;
}

export interface Marker {
  id: string;
  position: Location;
  title: string;
  type?: EventType;
}

