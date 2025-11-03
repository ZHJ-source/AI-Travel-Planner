// 用户需求
export interface TravelRequirements {
  destination: string;
  days: number;
  budget?: number;
  travelers?: number;
  preferences?: string[];
  specialNeeds?: string[];
  startDate?: string;
}

// 地理位置
export interface Location {
  lat: number;
  lng: number;
}

// 事件类型
export type EventType = 'attraction' | 'restaurant' | 'hotel' | 'transportation' | 'entertainment' | 'shopping';

// 事件
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

// 行程天
export interface ItineraryDay {
  id?: string;
  dayNumber: number;
  date?: string;
  events: Event[];
  notes?: string;
}

// 完整行程
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

// 预算
export interface Budget {
  transportationBudget: number;
  accommodationBudget: number;
  mealsBudget: number;
  ticketsBudget: number;
  othersBudget: number;
  totalBudget: number;
  notes?: Record<string, any>;
}

// 高德地图POI
export interface AMapPOI {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: string;
  distance?: string;
  tel?: string;
}

// LLM生成的原始行程
export interface RawItinerary {
  days: Array<{
    date?: string;
    events: Array<{
      time?: string;
      type: string;
      name: string;
      description?: string;
      estimatedDuration?: number;
      estimatedCost?: number;
    }>;
  }>;
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
}

