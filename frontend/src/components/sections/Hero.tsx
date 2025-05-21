import { useState } from "react";
import { motion } from "framer-motion";
import { ProductSearch } from "@/components/product/ProductSearch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import {
  PlayCircle,
  ArrowRight,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";

export const Hero = ({ onTrackProduct }) => {
  const { theme } = useTheme();
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"
            : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
        } transition-colors duration-500`}
      >
        {/* Animated dots overlay for texture */}
        <div className="absolute inset-0 opacity-10 bg-pattern"></div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Track & Compare Prices.
              <span
                className={`${theme === "dark" ? "text-blue-400" : "text-blue-600"} block mt-2`}
              >
                Never Overpay Again.
              </span>
            </h1>

            <p
              className={`mt-6 text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"} max-w-2xl`}
            >
              PricePulse monitors product prices across e-commerce sites and
              alerts you when prices drop. Save money and shop smarter with
              real-time price tracking.
            </p>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-5 w-5" />
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] p-0">
                  <div className="aspect-video w-full bg-black flex items-center justify-center">
                    {/* Replace with actual video embed */}
                    <div className="text-white text-center">
                      <p className="text-xl font-medium mb-4">Product Demo</p>
                      <p>Video walkthrough would appear here</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap gap-6 items-center">
              <div
                className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <span>Trusted by 5,000+ Shoppers</span>
              </div>

              <div
                className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                <Star className="h-5 w-5 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>

              <div
                className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>10M+ Prices Tracked</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div
              className={`w-full max-w-md ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300`}
            >
              <div
                className={`p-6 ${theme === "dark" ? "border-b border-gray-700" : "border-b"}`}
              >
                <h2
                  className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Start Tracking a Product
                </h2>
              </div>
              <div className="p-6">
                <ProductSearch onSubmit={onTrackProduct} isLoading={false} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
