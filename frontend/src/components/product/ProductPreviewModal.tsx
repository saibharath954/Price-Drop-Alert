import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductDisplay } from "./ProductDisplay";

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image: string;
    currentPrice: number;
    currency: string;
    url: string;
    lastUpdated: string;
    priceChange: {
      amount: number;
      percentage: number;
      direction: "up" | "down" | "stable";
    };
  } | null;
  onAdd: (targetPrice?: number) => void;
  loading: boolean;
}

export const ProductPreviewModal = ({
  isOpen,
  onClose,
  product,
  onAdd,
  loading,
}: ProductPreviewModalProps) => {
  const [targetPrice, setTargetPrice] = useState<string>(
    product?.currentPrice ? (product.currentPrice * 0.9).toFixed(2) : "",
  );

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Confirm Product Tracking</DialogTitle>
          <DialogDescription>
            Review the product details before adding to your tracked items.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProductDisplay
            product={{
              ...product,
              previousPrice: product.currentPrice,
              available: true,
              source: "Amazon",
              priceChange: {
                ...product.priceChange,
                direction: product.priceChange.direction as
                  | "up"
                  | "down"
                  | "same",
              },
            }}
            isPreview
          />
        </div>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="target-price">
              Optional: Set Target Price ({product.currency})
            </Label>
            <Input
              id="target-price"
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={`e.g. ${(product.currentPrice * 0.9).toFixed(2)}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Current price: {product.currency}
              {product.currentPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onAdd(targetPrice ? parseFloat(targetPrice) : undefined)
            }
            disabled={loading}
          >
            {loading ? "Adding..." : "Track Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
