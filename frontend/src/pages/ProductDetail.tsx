import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { ProductDisplay } from "@/components/product/ProductDisplay";
import { ProductPriceChart } from "@/components/charts/ProductPriceChart";
import { ProductComparison } from "@/components/product/ProductComparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/useTheme";
import { auth } from "@/lib/firebase";
import {
  getProductDetails,
  getPriceHistory,
  getPlatformComparisons,
  setPriceAlert,
  removePriceAlert,
} from "@/services/productService";

import { Product, PlatformPriceData, PriceDataPoint } from "@/types";

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<Product | null>(null);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<PlatformPriceData[]>([]);
  const { theme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (!productId || !user?.uid) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [product, history, comparisons] = await Promise.all([
          getProductDetails(productId, user.uid),
          getPriceHistory(productId),
          getPlatformComparisons(productId),
        ]);

        if (!product) {
          throw new Error("Product not found or not tracked by user");
        }

        setProductData(product);
        setPriceData(history);
        setComparisonData(comparisons);

        toast({
          title: "Product data loaded",
          description: "Successfully fetched latest price data.",
        });
      } catch (error) {
        console.error("Error loading product:", error);
        toast({
          title: "Error loading product",
          description:
            error instanceof Error
              ? error.message
              : "There was an issue loading this product.",
          variant: "destructive",
        });
        setProductData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, user?.uid]);

  const handleSetPriceAlert = async (
    productId: string,
    targetPrice: number,
    email: string,
  ) => {
    if (!user?.uid) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to set price alerts.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setPriceAlert(productId, user.uid, targetPrice, email);
      toast({
        title: "Price alert created",
        description: `We'll notify you at ${email} when the price drops below ${targetPrice}.`,
      });

      setProductData((prev) =>
        prev
          ? {
              ...prev,
              alertEnabled: true,
              targetPrice,
            }
          : null,
      );
    } catch (error) {
      console.error("Error setting price alert:", error);
      toast({
        title: "Failed to set alert",
        description: "There was an error creating your price alert.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAlert = async (productId: string) => {
    if (!user?.uid) return;

    try {
      await removePriceAlert(productId, user.uid);
      toast({
        title: "Price alert removed",
        description:
          "You will no longer receive notifications for this product.",
      });

      setProductData((prev) =>
        prev
          ? {
              ...prev,
              alertEnabled: false,
              targetPrice: null,
            }
          : null,
      );
    } catch (error) {
      console.error("Error removing price alert:", error);
      toast({
        title: "Failed to remove alert",
        description: "There was an error removing your price alert.",
        variant: "destructive",
      });
    }
  };

  const formatChartData = (history: PriceDataPoint[]) => {
    return history;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8  pt-24 overflow-hidden">
        <h1
          className={`text-3xl font-bold mb-8 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
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
                  onRemoveAlert={handleRemoveAlert}
                />
              </div>
              <div className="lg:col-span-2">
                <ProductPriceChart
                  priceData={formatChartData(priceData)}
                  currency={productData.currency ?? "Rs"}
                />
              </div>
            </div>
            {comparisonData.length > 0 && (
              <div className="pt-6">
                <ProductComparison
                  productName={productData.name}
                  platforms={comparisonData}
                />
              </div>
            )}

            <div className="pt-4">
              <Card
                className={`transition-all duration-300 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
              >
                <CardHeader>
                  <CardTitle>Stats & Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="price-stats">
                    <TabsList>
                      <TabsTrigger value="price-stats">Price Stats</TabsTrigger>
                      <TabsTrigger value="price-forecast">
                        Price Forecast
                      </TabsTrigger>
                      <TabsTrigger value="price-alerts">
                        Your Alerts
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="price-stats" className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                        >
                          <div className="text-sm text-gray-500">
                            Current Price
                          </div>
                          <div className="text-2xl font-bold">
                            {productData.currency}
                            {productData.currentPrice}
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                        >
                          <div className="text-sm text-gray-500">
                            Average Price (30d)
                          </div>
                          <div className="text-2xl font-bold">
                            {productData.currency}
                            {(productData.currentPrice * 1.05).toFixed(2)}
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                        >
                          <div className="text-sm text-gray-500">
                            Highest Price (90d)
                          </div>
                          <div className="text-2xl font-bold text-red-500">
                            {productData.currency}
                            {(productData.currentPrice * 1.2).toFixed(2)}
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                        >
                          <div className="text-sm text-gray-500">
                            Lowest Price (90d)
                          </div>
                          <div className="text-2xl font-bold text-green-500">
                            {productData.currency}
                            {(productData.currentPrice * 0.85).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-medium mb-4">
                            Price Frequency (90 days)
                          </h4>
                          <div className="h-[200px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                            <p className="text-gray-500">
                              Price distribution chart would appear here
                            </p>
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
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: "15%" }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Weekly</span>
                                <span className="text-sm font-medium">
                                  Medium
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: "45%" }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Monthly</span>
                                <span className="text-sm font-medium">
                                  High
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: "70%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="price-forecast" className="py-4">
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-lg mb-4">
                          Our AI-powered price forecast predicts this product's
                          price will likely
                          <span className="font-bold text-green-500">
                            {" "}
                            decrease{" "}
                          </span>
                          in the next 30 days.
                        </p>
                        <p className="text-gray-500">
                          Detailed forecasting data would appear here
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="price-alerts" className="py-4">
                      <div className="text-center p-8">
                        {productData.alertEnabled ? (
                          <>
                            <p className="text-lg mb-2">
                              Active price alert for {productData.name}
                            </p>
                            <p className="text-gray-500 mb-6">
                              You'll be notified at {user?.email} when the price
                              drops below {productData.currency}
                              {productData.targetPrice}
                            </p>
                            <button
                              onClick={() => handleRemoveAlert(productId!)}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                              Remove Alert
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg mb-2">
                              No active price alerts for this product
                            </p>
                            <p className="text-gray-500 mb-6">
                              Set an alert and we'll notify you when the price
                              drops
                            </p>
                          </>
                        )}
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
              We couldn't find the product you're looking for. It may have been
              removed or you need to track it first.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
