import {
  Product,
  PriceHistoryEntry,
  PriceDataPoint,
  PlatformPriceData,
} from "@/types";

export const transformProductFromFirestore = (data: any): Product => {
  return {
    ...data,
    previousPrice: data.previousPrice || data.currentPrice, // Default to currentPrice if missing
    lastUpdated:
      data.lastUpdated?.toDate().toISOString() || new Date().toISOString(),
    priceHistory: transformPriceHistory(data.priceHistory),
    trackers: transformTrackers(data.trackers),
    alertEnabled: data.alertEnabled || false,
    targetPrice: data.targetPrice || null,
  };
};

export const transformPriceHistory = (
  history: any[] = [],
): PriceDataPoint[] => {
  return history.map((entry) => ({
    date: (entry.date?.toDate?.() ?? new Date()).toISOString(),
    price: entry.price,
  }));
};

export const transformTrackers = (
  trackers: Record<string, any> = {},
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(trackers)) {
    result[key] = value?.toDate().toISOString() || new Date().toISOString();
  }
  return result;
};

export const transformPlatformData = (data: any): PlatformPriceData => {
  return {
    ...data,
    priceHistory: data.priceHistory
      ? transformPriceHistory(data.priceHistory)
      : [],
    logo:
      data.logo ||
      `https://via.placeholder.com/100x100.png?text=${data.platform}`,
    shipping: data.shipping || 0,
    available: data.available !== false,
  };
};
