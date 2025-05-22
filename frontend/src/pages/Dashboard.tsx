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
import { mockProductData, mockPriceData } from "@/lib/mockData";
import { Link } from "react-router-dom";

// Sample tracked products data
const getSampleTrackedProducts = () => {
  const products = [
    {
      id: "product1",
      name: "Samsung Galaxy S22 Ultra 5G (Phantom Black, 12GB, 256GB Storage)",
      image: "https://via.placeholder.com/300x300.png?text=Samsung+Galaxy",
      currentPrice: 1099.99,
      currency: "$",
      url: "https://example.com/product1",
      alertEnabled: true,
      targetPrice: 999.99,
      lastUpdated: "2024-05-15T14:30:00Z",
      priceChange: {
        amount: -50,
        percentage: 4.3,
        direction: "down" as const,
      },
    },
    {
      id: "product2",
      name: 'Apple MacBook Pro 14" with M2 Pro Chip, 16GB RAM, 512GB SSD',
      image: "https://via.placeholder.com/300x300.png?text=MacBook+Pro",
      currentPrice: 1999.99,
      currency: "$",
      url: "https://example.com/product2",
      alertEnabled: false,
      lastUpdated: "2024-05-20T10:15:00Z",
      priceChange: {
        amount: 0,
        percentage: 0,
        direction: "stable" as const,
      },
    },
    {
      id: "product3",
      name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
      image: "https://via.placeholder.com/300x300.png?text=Sony+Headphones",
      currentPrice: 349.99,
      currency: "$",
      url: "https://example.com/product3",
      alertEnabled: true,
      targetPrice: 299.99,
      lastUpdated: "2024-05-18T09:45:00Z",
      priceChange: {
        amount: 25,
        percentage: 7.7,
        direction: "up" as const,
      },
    },
    {
      id: mockProductData.id,
      name: mockProductData.name,
      image: mockProductData.image,
      currentPrice: mockProductData.currentPrice,
      currency: mockProductData.currency,
      url: mockProductData.url,
      alertEnabled: false,
      lastUpdated: "2024-05-21T08:30:00Z",
      priceChange: {
        amount: -15,
        percentage: 3.8,
        direction: "down" as const,
      },
    },
  ];

  return products;
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [trackedProducts, setTrackedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProductUrl, setNewProductUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { theme } = useTheme();
  const { user } = useUser();
  const { toast } = useToast();

  // Stats calculated from tracked products
  const totalTracked = trackedProducts.length;
  const averagePrice =
    trackedProducts.length > 0
      ? trackedProducts.reduce((sum, item) => sum + item.currentPrice, 0) /
        trackedProducts.length
      : 0;
  const averageSavings = 28.45; // Sample data - would be calculated from price history
  const lowestPrice =
    trackedProducts.length > 0
      ? {
          name: "Sony WH-1000XM5",
          price: 349.99,
          discount: 20,
        }
      : undefined;

  useEffect(() => {
    // Simulate API call to fetch user's tracked products
    const fetchTrackedProducts = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setTrackedProducts(getSampleTrackedProducts());
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

    fetchTrackedProducts();
  }, [toast]);

  const handleToggleAlert = (productId: string) => {
    setTrackedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, alertEnabled: !product.alertEnabled }
          : product,
      ),
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setTrackedProducts((prev) =>
      prev.filter((product) => product.id !== productId),
    );
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example new product
      const newProduct = {
        id: `product${Date.now()}`,
        name: "New Tracked Product - " + newProductUrl.slice(0, 20) + "...",
        image: "https://via.placeholder.com/300x300.png?text=New+Product",
        currentPrice: Math.floor(Math.random() * 500) + 100,
        currency: "$",
        url: newProductUrl,
        alertEnabled: false,
        lastUpdated: new Date().toISOString(),
        priceChange: {
          amount: 0,
          percentage: 0,
          direction: "stable" as const,
        },
      };

      setTrackedProducts((prev) => [newProduct, ...prev]);
      setNewProductUrl("");
      setShowNewProductInput(false);

      toast({
        title: "Product added",
        description: "The product is now being tracked!",
      });
    } catch (error) {
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
                  Manage your tracked products and price alerts
                </p>
              </div>
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
                    Add new product to track
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
                      {isAdding ? "Adding..." : "Track"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoading && (
              <DashboardStats
                totalTracked={totalTracked}
                averagePrice={averagePrice}
                currency="$"
                averageSavings={averageSavings}
                lowestPrice={lowestPrice}
              />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Your Tracked Products</h2>
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

            {isLoading ? (
              <TrackedProductsSkeleton />
            ) : filteredProducts.length > 0 ? (
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
                    onToggleAlert={handleToggleAlert}
                    onRemove={handleRemoveProduct}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                {searchQuery ? (
                  <p
                    className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No products match your search. Try a different term or clear
                    your search.
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
              </div>
            )}
          </motion.div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard;
