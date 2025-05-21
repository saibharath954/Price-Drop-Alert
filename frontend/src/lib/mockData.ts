// Sample product data
export const mockProductData = {
  id: "B08N5KWB9H",
  name: "Samsung Galaxy S21 5G | Factory Unlocked Android Cell Phone | US Version 5G Smartphone",
  image: "https://via.placeholder.com/300x300.png?text=Samsung+Galaxy+S21",
  currentPrice: 699.99,
  currency: "$",
  previousPrice: 799.99,
  url: "https://www.amazon.com/dp/B08N5KWB9H",
  source: "Amazon",
  lastUpdated: new Date().toISOString(),
  available: true,
  priceChange: {
    amount: -100,
    percentage: -12.5,
    direction: "down" as const,
  },
};

// Generate mock price history data
const generatePriceData = () => {
  const data = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  let currentDate = new Date(startDate);
  let currentPrice = 899.99;

  while (currentDate <= endDate) {
    // Add some random price fluctuations
    const priceChange = (Math.random() - 0.5) * 30;
    currentPrice = Math.max(650, Math.min(950, currentPrice + priceChange));

    data.push({
      date: new Date(currentDate).toISOString(),
      price: parseFloat(currentPrice.toFixed(2)),
    });

    // Move to next data point (every 3-5 days)
    const daysToAdd = Math.floor(Math.random() * 3) + 3;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }

  // Ensure the last price matches the current price
  data.push({
    date: new Date().toISOString(),
    price: mockProductData.currentPrice,
  });

  return data;
};

export const mockPriceData = generatePriceData();
