import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, ArrowRight, InfoIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

interface ProductSearchProps {
  onSubmit: (url: string, targetPrice?: number, email?: string) => void;
  isLoading: boolean;
}

export const ProductSearch = ({ onSubmit, isLoading }: ProductSearchProps) => {
  const { theme } = useTheme();
  const [url, setUrl] = useState("");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    // Basic validation for Amazon URL format
    const amazonUrlRegex =
      /^https?:\/\/(www\.)?(amazon\.com|amazon\.co\.uk|amazon\.in|amazon\.ca|amazon\.de|amazon\.fr|amazon\.es|amazon\.it|amazon\.co\.jp)\/[^\s]+$/i;
    return amazonUrlRegex.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a product URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid Amazon product URL");
      return;
    }

    setError(null);
    const targetPriceNum = targetPrice ? parseFloat(targetPrice) : undefined;
    onSubmit(url, targetPriceNum, email || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="product-url" className="text-base font-medium">
              Amazon Product URL
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Paste the full Amazon product URL from your browser's
                    address bar
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="product-url"
              placeholder="https://www.amazon.com/dp/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              required
              className={`pr-24 transition-all ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={isLoading}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "url-error" : undefined}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="absolute right-0 top-0 rounded-l-none h-full"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Tracking
                </>
              ) : (
                <>
                  Start Tracking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {error && (
            <motion.p
              id="url-error"
              className="mt-2 text-sm text-red-500"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="options">
            <AccordionTrigger className="text-sm">
              Price Alert Options
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-2">
                <div>
                  <Label
                    htmlFor="target-price"
                    className="flex items-center gap-2 mb-2"
                  >
                    Target Price
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            We'll notify you when the price drops below this
                            amount
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="target-price"
                    placeholder="e.g. 49.99"
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 mb-2"
                  >
                    Email for Price Alerts
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            We'll send you an email when the price reaches your
                            target
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </form>
  );
};

// Loading skeleton for product search form
export const ProductSearchSkeleton = () => {
  return (
    <div className="w-full">
      <div className="grid gap-4">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};
