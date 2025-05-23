import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  ExternalLink,
  BellRing,
  Star,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface PriceChange {
  amount: number;
  percentage: number;
  direction: "up" | "down" | "same";
}

interface Product {
  id: string;
  name: string;
  image: string;
  currentPrice: number;
  currency: string;
  previousPrice: number;
  url: string;
  source: string;
  lastUpdated: string;
  available: boolean;
  priceChange: PriceChange;
  rating?: number;
  brand?: string;
}

interface ProductDisplayProps {
  product: Product;
  onSetPriceAlert?: (
    productId: string,
    targetPrice: number,
    email: string,
  ) => void;
  isPreview?: boolean;
  onLoginRequest?: () => void;
}

export const ProductDisplay = ({
  product,
  onSetPriceAlert,
  isPreview = false,
  onLoginRequest,
}: ProductDisplayProps) => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>(
    product.currentPrice ? (product.currentPrice * 0.9).toFixed(2) : "",
  );
  const [email, setEmail] = useState("");

  const formatPrice = (price: number) => {
    return `${product.currency} ${price.toFixed(2)}`;
  };

  const getPriceChangeIcon = () => {
    switch (product.priceChange.direction) {
      case "up":
        return <ArrowUp className="h-5 w-5 text-red-500" />;
      case "down":
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriceChangeColor = () => {
    switch (product.priceChange.direction) {
      case "up":
        return "text-red-600";
      case "down":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleSetAlert = () => {
    if (!isAuthenticated && onLoginRequest) {
      onLoginRequest();
      return;
    }

    if (onSetPriceAlert && targetPrice && email) {
      onSetPriceAlert(product.id, parseFloat(targetPrice), email);
      setIsAlertDialogOpen(false);
    }
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`star-${i}`}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
        />,
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half-star" className="relative">
          <Star className="h-4 w-4 text-gray-300" />
          <Star
            className="absolute top-0 left-0 h-4 w-4 fill-yellow-400 text-yellow-400 overflow-hidden"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </span>,
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={`overflow-hidden transition-all duration-300 ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
        } hover:shadow-lg`}
      >
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-1">
            {product.brand && (
              <span className="text-sm font-medium text-gray-500">
                {product.brand}
              </span>
            )}
            <Badge
              variant={product.available ? "default" : "secondary"}
              className={product.available ? "bg-green-600" : ""}
            >
              {product.available ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2 leading-tight">
            {product.name}
          </CardTitle>

          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              {renderRatingStars(product.rating)}
              <span className="text-sm ml-1 text-gray-500">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="price-history">Price History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="h-48 w-full flex items-center justify-center mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain rounded"
                    loading="lazy"
                  />
                </div>

                <div className="text-center mb-4 w-full">
                  <div className="text-3xl font-bold mb-1">
                    {formatPrice(product.currentPrice)}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {getPriceChangeIcon()}
                    <span className={`${getPriceChangeColor()} font-medium`}>
                      {product.priceChange.direction !== "same"
                        ? `${product.priceChange.direction === "up" ? "+" : ""}${formatPrice(product.priceChange.amount)} (${product.priceChange.percentage.toFixed(1)}%)`
                        : "No change"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setIsAlertDialogOpen(true)}
                    className="flex items-center gap-2"
                    disabled={isPreview}
                  >
                    <BellRing className="h-4 w-4" />
                    {isPreview ? "Login to Set Alert" : "Set Price Alert"}
                  </Button>

                  <Button asChild className="flex items-center gap-2">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on {product.source}{" "}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="price-history">
              <div className="space-y-4">
                <div className="px-2 py-4 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {isPreview
                      ? "Price history available after tracking"
                      : "Price history visualization would display here"}
                  </p>
                </div>
                {!isPreview && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">
                      Price Statistics
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Current</span>
                        <span className="font-medium">
                          {formatPrice(product.currentPrice)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Previous</span>
                        <span className="font-medium">
                          {formatPrice(product.previousPrice)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Highest (30 days)</span>
                        <span className="font-medium">
                          {formatPrice(product.currentPrice + 15)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Lowest (30 days)</span>
                        <span className="font-medium">
                          {formatPrice(product.currentPrice - 20)}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <Separator />

        <CardFooter className="px-6 py-4">
          <div className="w-full grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Last Updated:</div>
            <div className="font-medium text-right">
              {new Date(product.lastUpdated).toLocaleString()}
            </div>
          </div>
        </CardFooter>

        {isPreview && (
          <CardFooter className="border-t p-4">
            <div className="w-full text-center">
              <p className="text-sm text-gray-500 mb-3">
                This is a preview. Log in to track this product and view full
                price history.
              </p>
              <Button
                onClick={onLoginRequest}
                className="gap-2 w-full"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                Log in to Track
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
            <DialogDescription>
              {!isAuthenticated
                ? "Please log in to set price alerts"
                : "We'll notify you when this product drops below your target price."}
            </DialogDescription>
          </DialogHeader>

          {isAuthenticated ? (
            <>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="alert-price">
                    Target Price ({product.currency})
                  </Label>
                  <Input
                    id="alert-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={`e.g. ${(product.currentPrice * 0.9).toFixed(2)}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current price: {formatPrice(product.currentPrice)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="alert-email">Email Address</Label>
                  <Input
                    id="alert-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAlertDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetAlert}
                  disabled={!targetPrice || !email}
                >
                  Create Alert
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center">
              <Button
                onClick={onLoginRequest}
                className="gap-2 mx-auto"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                Log in to Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export const ProductDisplaySkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-full mb-1" />
        <Skeleton className="h-7 w-3/4" />

        <div className="flex items-center gap-1 mt-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded" />
          </div>

          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-24 mx-auto" />
            <Skeleton className="h-5 w-36 mx-auto" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
