import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Eye, Trash2, Bell, BellOff, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

interface TrackedProductCardProps {
  product: {
    id: string;
    name: string;
    image: string;
    currentPrice: number;
    currency: string;
    url: string;
    alertEnabled: boolean;
    targetPrice?: number;
    lastUpdated: string;
    priceChange?: {
      amount: number;
      percentage: number;
      direction: "up" | "down" | "stable";
    };
  };
  onToggleAlert: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export const TrackedProductCard: React.FC<TrackedProductCardProps> = ({
  product,
  onToggleAlert,
  onRemove,
}: TrackedProductCardProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemove = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      onRemove(product.id);
      setIsDeleting(false);
      toast({
        title: "Product removed",
        description: `${product.name} has been removed from tracking.`,
      });
    }, 500);
  };

  const handleToggleAlert = () => {
    onToggleAlert(product.id);
    toast({
      title: product.alertEnabled ? "Alert disabled" : "Alert enabled",
      description: product.alertEnabled
        ? `You will no longer receive alerts for ${product.name}.`
        : `You will be alerted when ${product.name} drops below ${product.currency}${product.targetPrice || product.currentPrice}.`,
    });
  };

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
    >
      <div className="relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-contain bg-white p-4"
          />
        </Link>
        {product.priceChange && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
              product.priceChange.direction === "down"
                ? "bg-green-500/90 text-white"
                : product.priceChange.direction === "up"
                  ? "bg-red-500/90 text-white"
                  : "bg-gray-500/90 text-white"
            }`}
          >
            {product.priceChange.direction === "down"
              ? "↓"
              : product.priceChange.direction === "up"
                ? "↑"
                : "–"}{" "}
            {product.currency}
            {Math.abs(product.priceChange.amount).toFixed(2)} (
            {Math.abs(product.priceChange.percentage).toFixed(1)}%)
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-xl">
            {product.currency}
            {product.currentPrice.toFixed(2)}
          </div>
          <div
            className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          >
            Updated {new Date(product.lastUpdated).toLocaleDateString()}
          </div>
        </div>
        {product.targetPrice && (
          <div
            className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
          >
            Alert when below:{" "}
            <span className="font-medium">
              {product.currency}
              {product.targetPrice}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleAlert}>
            {product.alertEnabled ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Disable Alert</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Enable Alert</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View</span>
            </a>
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
