import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Section components for the landing page
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";

import TrackProduct from "@/pages/TrackProduct";

// Existing product related components
import { ProductSearch } from "@/components/product/ProductSearch";
import {
  ProductDisplay,
  ProductDisplaySkeleton,
} from "@/components/product/ProductDisplay";
import {
  ProductPriceChart,
  PriceChartSkeleton,
} from "@/components/charts/ProductPriceChart";
import {
  ProductComparison,
  ProductComparisonSkeleton,
} from "@/components/product/ProductComparison";

// UI components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data (keep this as is)
import { mockPriceData, mockProductData } from "@/lib/mockData";

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
    priceHistory: mockPriceData.map((item) => ({
      ...item,
      price: item.price + 15 + Math.random() * 5,
    })),
    logo: "https://via.placeholder.com/100x100.png?text=Walmart",
    shipping: 5.99,
    trend: "stable" as const,
  },
  {
    platform: "BestBuy",
    currentPrice: mockProductData.currentPrice - 10,
    currency: "$",
    url: "https://bestbuy.com",
    available: false,
    priceHistory: mockPriceData.map((item) => ({
      ...item,
      price: item.price - 10 - Math.random() * 5,
    })),
    logo: "https://via.placeholder.com/100x100.png?text=BestBuy",
    shipping: 0,
    trend: "up" as const,
    trendAmount: 5,
  },
];

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = async (
    url: string,
    targetPrice?: number,
    email?: string,
  ) => {
    if (!url || !url.includes("amazon")) {
      // Assuming your backend only supports Amazon for now
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Amazon product URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsSubmitted(true); // Set isSubmitted to true to reveal results section

    // Scroll to results after a brief delay
    setTimeout(() => {
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);

    // In a real app, this would be a fetch to your backend API
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add additional fields to mock data
      const enhancedProductData = {
        ...mockProductData,
        rating: 4.7,
        brand: "Samsung",
      };

      setProductData(enhancedProductData);
      setPriceData(mockPriceData);

      toast({
        title: "Product tracked successfully!",
        description: "We'll start tracking this product's price.",
      });

      if (targetPrice && email) {
        toast({
          title: "Price alert created",
          description: `We'll notify you at ${email} when the price drops below $${targetPrice}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error tracking product",
        description:
          "There was an issue tracking this product. Please try again.",
        variant: "destructive",
      });
      console.error("Error tracking product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPriceAlert = (
    productId: string,
    targetPrice: number,
    email: string,
  ) => {
    toast({
      title: "Price alert created",
      description: `We'll notify you at ${email} when the price drops below $${targetPrice}.`,
    });
  };

  return (
    <Layout>
      <Hero />
      <TrackProduct onSubmit={handleSubmit} isLoading={isLoading} />

      {isSubmitted && (
        <div id="results" className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <Tabs defaultValue="overview">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  {/* ProductSearch here allows searching again within the results section */}
                  <div className="flex justify-end">
                    <ProductSearch
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      {isLoading ? (
                        <ProductDisplaySkeleton />
                      ) : productData ? (
                        <ProductDisplay
                          product={productData}
                          onSetPriceAlert={handleSetPriceAlert}
                        />
                      ) : null}
                    </div>
                    <div className="lg:col-span-2">
                      {isLoading ? (
                        <PriceChartSkeleton />
                      ) : priceData.length > 0 ? (
                        <ProductPriceChart
                          priceData={priceData}
                          currency={productData?.currency || "$"}
                          targetPrice={349.99}
                        />
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comparison">
                  {isLoading ? (
                    <ProductComparisonSkeleton />
                  ) : productData ? (
                    <ProductComparison
                      productName={productData.name}
                      platforms={mockPlatforms}
                    />
                  ) : null}
                </TabsContent>

                <TabsContent value="analytics">
                  <Card
                    className={`transition-all duration-300 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
                  >
                    <CardHeader>
                      <CardTitle>Price Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <p className="text-lg">
                          Advanced price analytics would appear here
                        </p>
                        <p className="text-gray-500 mt-2 max-w-lg">
                          Including price fluctuation patterns, seasonal trends,
                          and AI-powered price forecasting
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      )}

      <div id="features">
        <Features />
      </div>
      <div id="how-it-works-section">
        {" "}
        {/* Matches the ID in Header.tsx */}
        <HowItWorks />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="faq">
        <FAQ />
      </div>
    </Layout>
  );
};

export default HomePage;
