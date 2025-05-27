import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";

interface PlatformPriceData {
  platform: string;
  currentPrice: number;
  currency: string;
  url: string;
  available: boolean;
  priceHistory?: Array<{ date: string; price: number }>;
  logo: string;
  shipping?: number;
  discount?: {
    originalPrice: number;
    percentage: number;
  };
  trend: "up" | "down" | "stable";
  trendAmount?: number;
}

interface SimilarProductData {
  productId: string; // Unique ID for the similar product
  name: string;
  platform: string;
  url: string;
  image: string;
  currentPrice: number;
  currency: string;
}

interface FirestoreComparisonData {
  primaryProductId: string;
  lastCompared: Timestamp;
  similarProducts: SimilarProductData[];
}

interface ProductComparisonProps {
  productId: string;
  productName: string;
  platforms: PlatformPriceData[];
}

export const ProductComparison = ({
  productId,
  productName,
  platforms,
}: ProductComparisonProps) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { user, token } = useUser();
  const [activePlatform, setActivePlatform] = useState<string>(
    platforms[0]?.platform || "",
  );
  // State for the *similar* products
  const [similarProducts, setSimilarProducts] = useState<SimilarProductData[]>(
    [],
  );
  const [loadingComparisons, setLoadingComparisons] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort platforms by price (lowest first) for the *main* product comparison tab
  const sortedPlatforms = [...platforms].sort((a, b) => {
    const totalA = a.currentPrice + (a.shipping || 0);
    const totalB = b.currentPrice + (b.shipping || 0);
    return totalA - totalB;
  });

  // Find cheapest platform for the *main* product comparison tab
  const cheapestPlatform = sortedPlatforms[0];

  const formatPrice = (price: number, currency: string = "Rs ") => {
    return `${currency}${price.toFixed(2)}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-red-500";
      case "down":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const calculateSavings = () => {
    if (platforms.length <= 1) return null;

    const highestPrice = Math.max(
      ...platforms.map((p) => p.currentPrice + (p.shipping || 0)),
    );
    const lowestPrice = Math.min(
      ...platforms.map((p) => p.currentPrice + (p.shipping || 0)),
    );
    const savingsAmount = highestPrice - lowestPrice;
    const savingsPercent = (savingsAmount / highestPrice) * 100;

    if (savingsAmount <= 0) return null;

    return {
      amount: savingsAmount,
      percent: savingsPercent,
    };
  };

  const savings = calculateSavings();

  // Custom tooltip for price charts (for main product history)
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          className={`p-3 rounded shadow-lg ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"}`}
        >
          <p className="text-sm font-medium">
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-base font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(
              data.value,
              platforms.find((p) => p.platform === activePlatform)?.currency,
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!productId) {
        setLoadingComparisons(false);
        return;
      }

      setLoadingComparisons(true);
      setError(null);

      try {
        const res = await axios.post<SimilarProductData[]>( // Specify response type
          `${import.meta.env.VITE_API_URL}/compare`,
          { productId: productId, productTitle: productName },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Include the Bearer token
            },
          },
        );

        const backendData = res.data; // Axios puts the response data in .data
        setSimilarProducts(backendData);
        toast({
          title: "Comparison data updated",
          description: "Fetched fresh comparison data.",
        });
      } catch (err: any) {
        console.error("Error fetching similar products:", err);
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          "Something went wrong fetching similar products.";
        setError(errorMessage);
        toast({
          title: "Comparison Error",
          description: errorMessage,
          variant: "destructive",
        });
        setSimilarProducts([]); // Clear any old data on error
      } finally {
        setLoadingComparisons(false);
      }
    };

    fetchSimilarProducts();
  }, [productId, productName, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card
        className={`transition-all duration-300 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xl">Price Comparison</CardTitle>
            {savings && (
              <Badge className="bg-green-600">
                Save up to {formatPrice(savings.amount)} (
                {savings.percent.toFixed(1)}%)
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{productName}</p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="similar" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="similar">Similar Products</TabsTrigger>{" "}
              {/* New Tab */}
            </TabsList>

            {/* NEW Tab Content for Similar Products */}
            <TabsContent value="similar" className="space-y-4">
              {loadingComparisons ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={`similar-skeleton-${i}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <p>Could not load similar products.</p>
                </div>
              ) : similarProducts.length > 0 ? (
                <div className="grid gap-4">
                  {similarProducts.map((similarProduct, index) => (
                    <motion.div
                      key={similarProduct.productId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img
                              src={similarProduct.image}
                              alt={similarProduct.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-base line-clamp-2">
                              {similarProduct.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {similarProduct.platform}
                            </p>
                            <p className="font-bold text-lg mt-1">
                              {formatPrice(
                                similarProduct.currentPrice,
                                similarProduct.currency,
                              )}
                            </p>
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-shrink-0"
                          >
                            <a
                              href={similarProduct.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No similar products found for this item.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ProductComparisonSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" /> {/* Added for new tab */}
          </div>

          {/* Skeleton for main product comparison */}
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={`main-skeleton-${i}`} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16 mt-1" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
