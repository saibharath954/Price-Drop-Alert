import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TrackedProductCard } from "@/components/dashboard/TrackedProductCard";
import { TrackedProductsSkeleton } from "@/components/dashboard/TrackedProductsSkeleton";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import axios from "axios";

interface PriceChange {
  amount: number;
  percentage: number;
  direction: "up" | "down" | "stable";
}

interface TrackedProduct {
  id: string;
  name: string;
  image: string;
  currentPrice: number;
  currency: string;
  url: string;
  alertEnabled: boolean;
  targetPrice?: number;
  lastUpdated: string;
  priceChange: PriceChange;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProductUrl, setNewProductUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { theme } = useTheme();
  const { user, token } = useUser();
  const { toast } = useToast();

  // Stats calculated from tracked products
  const totalTracked = trackedProducts.length;
  const averagePrice =
    trackedProducts.length > 0
      ? trackedProducts.reduce((sum, item) => sum + item.currentPrice, 0) /
        trackedProducts.length
      : 0;

  // Calculate average savings based on price changes
  const averageSavings =
    trackedProducts.length > 0
      ? trackedProducts.reduce((sum, product) => {
          if (product.priceChange.direction === "down") {
            return sum + product.priceChange.amount;
          }
          return sum;
        }, 0) / trackedProducts.length
      : 0;

  // Find the product with the lowest current price
  const lowestPrice =
    trackedProducts.length > 0
      ? {
          name: trackedProducts.reduce((prev, current) =>
            prev.currentPrice < current.currentPrice ? prev : current,
          ).name,
          price: Math.min(...trackedProducts.map((p) => p.currentPrice)),
          discount: 0, // This would need actual calculation based on historical data
        }
      : undefined;

  const calculatePriceChange = (priceHistory: any[]): PriceChange => {
    if (priceHistory.length < 2) {
      return {
        amount: 0,
        percentage: 0,
        direction: "stable",
      };
    }

    const current = priceHistory[0].price;
    const previous = priceHistory[1].price;
    const amount = current - previous;
    const percentage = (Math.abs(amount) / previous) * 100;
    const direction = amount > 0 ? "up" : amount < 0 ? "down" : "stable";

    return {
      amount: Math.abs(amount),
      percentage,
      direction,
    };
  };    

  const fetchTrackedProducts = async () => {
    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get("/api/user/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

       const products = (response.data ?? []).map((product: any) => ({
        ...product,
        priceChange: calculatePriceChange(product.priceHistory || []),
      }));
      console.log("Fetched products:", products);

      setTrackedProducts(products);
    } catch (error) {
      console.error("Error fetching tracked products:", error);
      toast({
        title: "Error fetching products",
        description: "There was an issue loading your tracked products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackedProducts();
  }, [user, token]);

  const handleToggleAlert = async (productId: string) => {
    if (!user || !token) return;

    try {
      // Get the current product to determine the new state
      const product = trackedProducts.find((p) => p.id === productId);
      if (!product) return;

      const newAlertState = !product.alertEnabled;

      await axios.post(
        "/api/product/alert",
        {
          productId,
          enable: newAlertState,
          targetPrice: product.targetPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTrackedProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, alertEnabled: newAlertState }
            : product,
        ),
      );
    } catch (error) {
      console.error("Error toggling alert:", error);
      toast({
        title: "Error updating alert",
        description: "There was an issue updating your price alert.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!user || !token) return;

    try {
      await axios.delete(`/api/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTrackedProducts((prev) =>
        prev.filter((product) => product.id !== productId),
      );
      toast({
        title: "Product removed",
        description: "The product is no longer being tracked.",
      });
    } catch (error) {
      console.error("Error removing product:", error);
      toast({
        title: "Error removing product",
        description: "There was an issue removing this product.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid product URL",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      if (user && token) {
        // Authenticated flow - track the product
        const response = await axios.post(
          "/api/track",
          {
            url: newProductUrl,
            userId: user.uid,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Fetch the newly added product details
        const productResponse = await axios.get(
          `/api/product/${response.data.productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setTrackedProducts((prev) => [
          {
            ...productResponse.data,
            priceChange: {
              amount: 0,
              percentage: 0,
              direction: "stable",
            },
          },
          ...prev,
        ]);
      } else {
        // Unauthenticated flow - just show a preview
        const response = await axios.post("/api/scrape-preview", {
          url: newProductUrl,
        });

        toast({
          title: "Please sign in to track products",
          description:
            "You can preview products without signing in, but need an account to track them.",
          variant: "default",
        });
      }

      setNewProductUrl("");
      setShowNewProductInput(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error adding product",
        description: "There was an issue adding this product.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredProducts = trackedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 pt-24 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Your Dashboard</h1>
                <p
                  className={`mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  {user
                    ? "Manage your tracked products and price alerts"
                    : "Sign in to track products and get price alerts"}
                </p>
              </div>
              {user && (
                <Button
                  onClick={() => setShowNewProductInput(!showNewProductInput)}
                  className={`${showNewProductInput ? "bg-gray-500 hover:bg-gray-600" : ""}`}
                >
                  {showNewProductInput ? (
                    <>
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Track New Product
                    </>
                  )}
                </Button>
              )}
            </div>

            {showNewProductInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div
                  className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <h2 className="text-lg font-semibold mb-3">
                    {user ? "Add new product to track" : "Preview a product"}
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste Amazon product URL..."
                      value={newProductUrl}
                      onChange={(e) => setNewProductUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddNewProduct}
                      disabled={isAdding || !newProductUrl.trim()}
                    >
                      {isAdding
                        ? user
                          ? "Adding..."
                          : "Previewing..."
                        : user
                          ? "Track"
                          : "Preview"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoading && user && (
              <DashboardStats
                totalTracked={totalTracked}
                averagePrice={averagePrice}
                currency={trackedProducts[0]?.currency || "$"}
                averageSavings={averageSavings}
                lowestPrice={lowestPrice}
              />
            )}

            {user && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold">
                  Your Tracked Products
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <TrackedProductsSkeleton />
            ) : user && filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product) => (
                  <TrackedProductCard
                    key={product.id}
                    product={product}
                    onToggleAlert={() => handleToggleAlert(product.id)}
                    onRemove={() => handleRemoveProduct(product.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                {user ? (
                  <>
                    <h3 className="text-xl font-medium mb-2">
                      {searchQuery
                        ? "No products found"
                        : "No tracked products yet"}
                    </h3>
                    {searchQuery ? (
                      <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                      >
                        No products match your search. Try a different term or
                        clear your search.
                      </p>
                    ) : (
                      <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                      >
                        You're not tracking any products yet. Click "Track New
                        Product" to get started.
                      </p>
                    )}
                    {searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                        className="mt-4"
                      >
                        Clear Search
                      </Button>
                    )}
                    {!searchQuery && (
                      <Button
                        onClick={() => setShowNewProductInput(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Track New Product
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-medium mb-2">
                      Sign in to track products
                    </h3>
                    <p
                      className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} mb-6`}
                    >
                      You can preview products without signing in, but need an
                      account to track them and get price alerts.
                    </p>
                    <Button asChild>
                      <Link to="/signin">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard;
