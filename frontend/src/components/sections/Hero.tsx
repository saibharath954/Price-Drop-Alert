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
  MonitorCheck,
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
        {/* Main Hero Content and Image/Illustration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
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

          {/* Top right image/illustration section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center lg:justify-end mt-8 lg:mt-0"
          >
            <div
              className={`w-full max-w-lg lg:max-w-none h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden shadow-2xl relative ${
                theme === "dark" ? "bg-gray-700" : "bg-blue-100"
              }`}
            >
              {/* Using the provided external image URL directly */}
              <img
                src="https://buyhatke.com/_app/immutable/assets/ic_multi_store.D1gUxGvc.webp"
                alt="Multi-store price comparison illustration"
                className="w-full h-full object-contain"
              />
              {/* Optional overlay/gradient to make image pop more or blend */}
              <div
                className={`absolute inset-0 ${
                  theme === "dark"
                    ? "bg-gradient-to-t from-gray-800/20 to-transparent"
                    : "bg-gradient-to-t from-white/20 to-transparent"
                }`}
              ></div>
            </div>
          </motion.div>
        </div>

        {/* --- */}

        {/* Start Tracking a Product Section (now full width, matching theme colors) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className={`mt-16 p-8 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-[1.005] ${
            theme === "dark"
              ? "bg-gray-800 hover:shadow-blue-500/30"
              : "bg-white hover:shadow-blue-300/50"
          }`}
        >
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
              <h2
                className={`text-3xl font-bold flex items-center gap-3 mb-4 md:mb-0 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                <MonitorCheck className="h-8 w-8 text-blue-500 animate-bounce" />
                Track Your Next Best Deal!
              </h2>
              <Button
                variant="outline"
                size="lg"
                className={`flex items-center gap-2 ${
                  theme === "dark"
                    ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                How it works <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <ProductSearch onSubmit={onTrackProduct} isLoading={false} />
            <p
              className={`mt-6 text-base text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Simply paste a product link from Amazon, Flipkart, eBay, or your
              favorite e-commerce site to start tracking.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
