import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

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
const BASE_URL = import.meta.env.VITE_API_URL; 

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const handlePreview = async (url: string) => {
    if (!url) {
      toast({
        title: "Invalid URL",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (error) {
      toast({
        title: "Invalid URL",
        description:
          "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/scrape-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          // Add any additional required fields here
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch preview");
      }

      const data = await response.json();
      setPreviewData(data);

      toast({
        title: "Product preview loaded",
        description: "You can now track this product",
      });
    } catch (error) {
      toast({
        title: "Error loading preview",
        description:
          error instanceof Error
            ? error.message
            : "Could not fetch product data. Please try again.",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackProduct = async (
    url: string,
    targetPrice?: number,
    email?: string,
  ) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "product-preview" } });
      return;
    }

    setIsLoading(true);

    try {
      // Call your /track endpoint
      const response = await fetch(`${BASE_URL}/api/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          targetPrice,
          email,
        }),
      });

      if (!response.ok) throw new Error("Failed to track product");

      const data = await response.json();

      toast({
        title: "Product tracked!",
        description: "We'll monitor this product for you",
      });

      if (targetPrice) {
        toast({
          title: "Price alert set",
          description: `We'll notify you when the price drops below ${targetPrice}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error tracking product",
        description: "Could not track this product. Please try again.",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRequest = () => {
    navigate("/login", { state: { from: "product-preview" } });
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
      <TrackProduct
        onSubmit={handlePreview}
        isLoading={isLoading}
        previewData={previewData}
        onLoginRequest={handleLoginRequest}
      />
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
