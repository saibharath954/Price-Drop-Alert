import { useState } from "react";
import { motion } from "framer-motion";
import {
  MonitorCheck,
  Search,
  Mail,
  Bell,
  CheckCircle2,
  Sparkles,
  Loader2,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TrackProductProps {
  onSubmit: (
    url: string,
    targetPrice?: number,
    email?: string,
  ) => Promise<void>;
  isLoading: boolean;
  previewData?: {
    name: string;
    image: string;
    currentPrice: number;
    currency: string;
    url: string;
    source: string;
  } | null;
  onLoginRequest?: () => void;
}

const TrackProduct = ({
  onSubmit,
  isLoading,
  previewData,
  onLoginRequest,
}: TrackProductProps) => {
  const [productUrl, setProductUrl] = useState("");
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const supportedStores = [
    { name: "Amazon", logo: "🛒", color: "bg-orange-100 text-orange-600" },
    { name: "Walmart", logo: "🏪", color: "bg-blue-100 text-blue-600" },
    { name: "Best Buy", logo: "🖥️", color: "bg-yellow-100 text-yellow-600" },
    { name: "eBay", logo: "💎", color: "bg-purple-100 text-purple-600" },
    { name: "Target", logo: "🎯", color: "bg-red-100 text-red-600" },
    { name: "Costco", logo: "🏢", color: "bg-green-100 text-green-600" },
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(
      productUrl,
      targetPrice ? parseFloat(targetPrice) : undefined,
      email || undefined,
    );
  };

  const handleTrackProduct = async () => {
    if (!isAuthenticated && onLoginRequest) {
      onLoginRequest();
      return;
    }

    try {
      await onSubmit(
        productUrl,
        targetPrice ? parseFloat(targetPrice) : undefined,
        email || undefined,
      );
      toast({
        title: "Product tracked!",
        description: "We'll monitor this product for you",
      });
    } catch (error) {
      toast({
        title: "Error tracking product",
        description: "Could not track this product. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="track-product" className="py-20 relative">
      <div
        className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800"
            : "bg-gradient-to-b from-white via-white to-gray-50"
        }`}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-20 right-10 w-32 h-32 rounded-full ${
            theme === "dark" ? "bg-blue-900/30" : "bg-blue-100/50"
          } blur-2xl`}
        ></div>
        <div
          className={`absolute bottom-20 left-10 w-40 h-40 rounded-full ${
            theme === "dark" ? "bg-purple-900/20" : "bg-purple-100/40"
          } blur-2xl`}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div
          className={`p-8 md:p-12 rounded-3xl shadow-2xl max-w-5xl mx-auto transform transition-all duration-500 ${
            theme === "dark"
              ? "bg-gray-800/80 backdrop-blur-sm shadow-blue-500/10 border border-gray-700"
              : "bg-white/80 backdrop-blur-sm shadow-blue-300/20 border border-gray-100"
          }`}
        >
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`text-3xl md:text-5xl font-bold mb-6 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Track Your Next Best Deal!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className={`text-xl max-w-3xl mx-auto leading-relaxed ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Enter any product URL from major e-commerce sites and get instant
              price tracking. We'll monitor it 24/7 and alert you when prices
              drop!
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8"
          >
            <p
              className={`text-center text-sm mb-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Supported platforms:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {supportedStores.map((store, index) => (
                <div
                  key={index}
                  className={`flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                    theme === "dark" ? "bg-gray-700 text-gray-300" : store.color
                  }`}
                >
                  <span className="mr-2">{store.logo}</span>
                  {store.name}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onSubmit={handleFormSubmit}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search
                    className={`h-5 w-5 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
                <input
                  type="url"
                  placeholder="Paste product URL (e.g., https://amazon.com/product...)"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-4 rounded-xl text-lg ${
                    theme === "dark"
                      ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white"
                  } border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !productUrl.trim()}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {previewData ? "Update Preview" : "Preview Product"}
                  </>
                )}
              </button>
            </div>

            {/* Product Preview Section */}
            {previewData && (
              <div
                className={`mt-6 p-6 rounded-2xl border-2 ${
                  theme === "dark"
                    ? "border-blue-700 bg-gray-700/30"
                    : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <img
                      src={previewData.image}
                      alt={previewData.name}
                      className="w-32 h-32 object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {previewData.name}
                    </h3>
                    <p className="text-2xl font-bold">
                      {previewData.currency}
                      {previewData.currentPrice?.toFixed(2) ?? ""}
                    </p>
                    <a
                      href={previewData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm mt-2 text-blue-600 hover:underline"
                    >
                      View on {previewData.source}{" "}
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="text-center">
                    <Button
                      onClick={onLoginRequest}
                      className="gap-2"
                      size="lg"
                    >
                      <LogIn className="h-4 w-4" />
                      Log in to track this product
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className={`mt-6 p-6 rounded-2xl border-2 ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700/30"
                          : "border-gray-300 bg-gray-50/50"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            className={`block text-sm font-semibold mb-2 ${
                              theme === "dark"
                                ? "text-gray-200"
                                : "text-gray-700"
                            }`}
                          >
                            📧 Email for price alerts
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail
                                className={`h-5 w-5 ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <input
                              type="email"
                              placeholder="your@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`block w-full pl-10 pr-4 py-3 rounded-xl ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              } border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-semibold mb-2 ${
                              theme === "dark"
                                ? "text-gray-200"
                                : "text-gray-700"
                            }`}
                          >
                            💰 Target price (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span
                                className={`text-sm font-medium ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                $
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder={(
                                previewData.currentPrice * 0.9
                              ).toFixed(2)}
                              value={targetPrice}
                              onChange={(e) => setTargetPrice(e.target.value)}
                              className={`block w-full pl-8 pr-4 py-3 rounded-xl ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                              } border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                            />
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Current price: {previewData.currency}
                            {previewData.currentPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <Button
                          type="button"
                          onClick={handleTrackProduct}
                          className="gap-2"
                          size="lg"
                        >
                          <MonitorCheck className="h-4 w-4" />
                          Track This Product
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Show price alert options only when there's no preview */}
            {!previewData && (
              <div
                className={`mt-8 p-6 rounded-2xl border-2 border-dashed space-y-6 ${
                  theme === "dark"
                    ? "border-gray-600 bg-gray-700/30"
                    : "border-gray-300 bg-gray-50/50"
                }`}
              >
                <div className="text-center">
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Optionally, set up price alerts to get notified when the
                    price drops
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      📧 Email for price alerts
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail
                          className={`h-5 w-5 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`block w-full pl-10 pr-4 py-3 rounded-xl ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        } border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      💰 Target price (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span
                          className={`text-sm font-medium ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          $
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className={`block w-full pl-8 pr-4 py-3 rounded-xl ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        } border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      />
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Leave empty to get notified of any price drop
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.form>
        </div>
      </motion.div>
    </section>
  );
};

export default TrackProduct;
