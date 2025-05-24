// Standardized Product type
export interface Product {
  id: string;
  name: string;
  image: string;
  currentPrice: number;
  currency: string;
  previousPrice: number; // Made required
  url: string;
  source: string;
  lastUpdated: string; // Changed to string
  available: boolean;
  priceChange: PriceChange;
  rating?: number;
  brand?: string;
  priceHistory: PriceDataPoint[]; // Using PriceDataPoint instead of PriceHistoryEntry
  trackers?: Record<string, string>; // Dates as strings
  alertEnabled?: boolean;
  targetPrice?: number | null;
}

// For components expecting date as string
export interface PriceDataPoint {
  date: string;
  price: number;
}

// For Firestore operations (dates as Date)
export interface PriceHistoryEntry {
  date: Date;
  price: number;
}

// Standardized PlatformPriceData
export interface PlatformPriceData {
  platform: string;
  currentPrice: number;
  currency: string;
  url: string;
  available: boolean;
  priceHistory?: PriceDataPoint[]; // Using PriceDataPoint
  logo: string;
  shipping?: number;
  discount?: {
    originalPrice: number;
    percentage: number;
  };
  trend: "up" | "down" | "stable";
  trendAmount?: number;
}

export interface PriceChange {
  amount: number;
  percentage: number;
  direction: "up" | "down" | "same" | "stable";
}

export interface AlertData {
  productId: string;
  userId: string;
  targetPrice: number;
  email: string;
  isActive: boolean;
  createdAt: Date;
}
