
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { ProductDisplay } from "@/components/product/ProductDisplay";
import { ProductPriceChart } from "@/components/charts/ProductPriceChart";
import { ProductComparison } from "@/components/product/ProductComparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { mockPriceData, mockProductData } from "@/lib/mockData";
import { useTheme } from "@/hooks/useTheme";

const mockPlatforms = [
  {
    platform: "Amazon",
    currentPrice: mockProductData.currentPrice,
    currency: "$",
    url: mockProductData.url,
    available: true,
    priceHistory: mockPriceData,
    logo: "https://via.placeholder.com/100x100.png?text=Amazon",
    shipping: 0,
    trend: "down" as const,
    trendAmount: 100,
  },
  {
    platform: "Walmart",
    currentPrice: mockProductData.currentPrice + 15,
    currency: "$",
    url: "https://walmart.com",
    available: true,
    priceHistory: mockPriceData.map(item => ({
      ...item,
      price: item.price + 15 + (Math.random() * 5)
    })),
    logo: "https://via.placeholder.com/100x100.png?text=Walmart",
    shipping: 5.99,
    discount: {
      originalPrice: mockProductData.currentPrice + 50,
      percentage: 20
    },
    trend: "stable" as const,
  },
  {
    platform: "BestBuy",
    currentPrice: mockProductData.currentPrice - 10,
    currency: "$",
    url: "https://bestbuy.com",
    available: false,
    priceHistory: mockPriceData.map(item => ({
      ...item,
      price: item.price - 10 - (Math.random() * 5)
    })),
    logo: "https://via.placeholder.com/100x100.png?text=BestBuy",
    shipping: 0,
    trend: "up" as const,
    trendAmount: 5,
  }
];

const ProductDetail = () => {
  const { productId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const { theme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call to fetch product and price data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Add a rating and brand to the mock data
        const enhancedProductData = {
          ...mockProductData,
          rating: 4.7,
          brand: "Samsung"
        };
        
        setProductData(enhancedProductData);
        setPriceData(mockPriceData);
        setComparisonData(mockPlatforms);
        
        toast({
          title: "Product data loaded",
          description: "Successfully fetched latest price data.",
        });
      } catch (error) {
        toast({
          title: "Error loading product",
          description: "There was an issue loading this product. Please try again.",
          variant: "destructive",
        });
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, toast]);

  const handleSetPriceAlert = (productId: string, targetPrice: number, email: string) => {
    toast({
      title: "Price alert created",
      description: `We'll notify you at ${email} when the price drops below ${targetPrice}.`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-8 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Product Details{productId && `: ${productId}`}
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
          </div>
        ) : productData ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <ProductDisplay 
                  product={productData} 
                  onSetPriceAlert={handleSetPriceAlert}
                />
              </div>
              <div className="lg:col-span-2">
                <ProductPriceChart 
                  priceData={priceData}
                  currency={productData.currency}
                />
              </div>
            </div>
            
            <div className="pt-6">
              <ProductComparison
                productName={productData.name}
                platforms={comparisonData}
              />
            </div>
            
            <div className="pt-4">
              <Card className={`transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle>Stats & Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="price-stats">
                    <TabsList>
                      <TabsTrigger value="price-stats">Price Stats</TabsTrigger>
                      <TabsTrigger value="price-forecast">Price Forecast</TabsTrigger>
                      <TabsTrigger value="price-alerts">Your Alerts</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="price-stats" className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="text-sm text-gray-500">Current Price</div>
                          <div className="text-2xl font-bold">{productData.currency}{productData.currentPrice}</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="text-sm text-gray-500">Average Price (30d)</div>
                          <div className="text-2xl font-bold">{productData.currency}{(productData.currentPrice * 1.05).toFixed(2)}</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="text-sm text-gray-500">Highest Price (90d)</div>
                          <div className="text-2xl font-bold text-red-500">{productData.currency}{(productData.currentPrice * 1.2).toFixed(2)}</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="text-sm text-gray-500">Lowest Price (90d)</div>
                          <div className="text-2xl font-bold text-green-500">{productData.currency}{(productData.currentPrice * 0.85).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-medium mb-4">Price Frequency (90 days)</h4>
                          <div className="h-[200px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                            <p className="text-gray-500">Price distribution chart would appear here</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-4">Price Volatility</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Daily</span>
                                <span className="text-sm font-medium">Low</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: "15%" }}></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Weekly</span>
                                <span className="text-sm font-medium">Medium</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: "45%" }}></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Monthly</span>
                                <span className="text-sm font-medium">High</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: "70%" }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="price-forecast" className="py-4">
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-lg mb-4">
                          Our AI-powered price forecast predicts this product's price will likely
                          <span className="font-bold text-green-500"> decrease </span>
                          in the next 30 days.
                        </p>
                        <p className="text-gray-500">
                          Detailed forecasting data would appear here
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="price-alerts" className="py-4">
                      <div className="text-center p-8">
                        <p className="text-lg mb-2">No active price alerts for this product</p>
                        <p className="text-gray-500 mb-6">
                          Set an alert and we'll notify you when the price drops
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">
              We couldn't find the product you're looking for. It may have been removed or the URL is incorrect.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
