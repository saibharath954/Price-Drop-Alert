import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Zap,
  Globe,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const Features = () => {
  const { theme } = useTheme();
  const features = [
    {
      icon: BarChart3,
      title: "Real-time Price Tracking",
      description:
        "Monitor price changes on your favorite products with hourly updates. View comprehensive price history charts to identify trends and patterns.",
      highlights: [
        "Hourly price checks",
        "Interactive price charts",
        "Historical data analysis",
      ],
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Bell,
      title: "Smart Price Alerts",
      description:
        "Set your target price and get instant notifications when prices fall. Never miss a deal again with customizable price alerts.",
      highlights: [
        "Email & SMS notifications",
        "Custom price thresholds",
        "Instant alerts",
      ],
      color: "green",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Comparison",
      description:
        "Our AI identifies your product and finds identical or similar items across multiple platforms, giving you comprehensive price comparison.",
      highlights: [
        "Cross-platform search",
        "Smart product matching",
        "Best deal finder",
      ],
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: TrendingUp,
      title: "Price Trend Analysis",
      description:
        "Understand price patterns with advanced analytics that predict the best time to buy based on historical data and market trends.",
      highlights: [
        "Seasonal trend detection",
        "Price prediction",
        "Best time to buy",
      ],
      color: "yellow",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: ShoppingBag,
      title: "Multi-Platform Support",
      description:
        "Track prices across all major e-commerce platforms including Amazon, Walmart, Best Buy, eBay, and many more in one unified dashboard.",
      highlights: [
        "Support for 50+ retailers",
        "Unified dashboard",
        "Cross-platform history",
      ],
      color: "red",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: ShieldCheck,
      title: "Privacy & Security",
      description:
        "We never share your data with third parties. Your shopping habits and email are protected with enterprise-grade security.",
      highlights: [
        "No data sharing",
        "Encrypted communications",
        "GDPR compliant",
      ],
      color: "teal",
      gradient: "from-teal-500 to-cyan-500",
    },
  ];

  const stats = [
    {
      icon: Globe,
      number: "50+",
      label: "Supported Retailers",
      color: "text-blue-500",
    },
    {
      icon: Zap,
      number: "24/7",
      label: "Price Monitoring",
      color: "text-green-500",
    },
    {
      icon: TrendingUp,
      number: "99.9%",
      label: "Uptime Guarantee",
      color: "text-purple-500",
    },
    {
      icon: ShieldCheck,
      number: "100%",
      label: "Data Privacy",
      color: "text-red-500",
    },
  ];

  return (
    <section
      id="features"
      className={`py-20 relative ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-0 left-0 w-full h-full opacity-5 ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-100"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${theme === "dark" ? "#ffffff" : "#000000"} 1px, transparent 0)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${
              theme === "dark"
                ? "bg-blue-900/50 text-blue-300"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            ⚡ Powerful Features
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-3xl md:text-5xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Everything You Need For
            <span
              className={`block ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
            >
              Smarter Shopping
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-xl leading-relaxed ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            PricePulse combines advanced price tracking with AI-powered features
            to help you save money and shop smarter than ever before.
          </motion.p>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center p-4 rounded-2xl ${
                theme === "dark" ? "bg-gray-900/50" : "bg-white/50"
              } backdrop-blur-sm border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
              <div
                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {stat.number}
              </div>
              <div
                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group p-8 rounded-2xl ${
                theme === "dark"
                  ? "bg-gray-900/80 border border-gray-700 hover:border-gray-600 hover:bg-gray-900"
                  : "bg-white border border-gray-100 hover:border-gray-200 hover:bg-white"
              } shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm`}
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${feature.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r ${feature.gradient} opacity-20 group-hover:opacity-40 transition-all duration-300`}
                ></div>
              </div>

              {/* Content */}
              <h3
                className={`text-xl font-bold mb-4 group-hover:${theme === "dark" ? "text-blue-400" : "text-blue-600"} transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {feature.title}
              </h3>

              <p
                className={`mb-6 leading-relaxed ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {feature.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-3">
                {feature.highlights.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Hover Effect */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-all duration-300 pointer-events-none`}
              ></div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div
            className={`inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-2xl ${
              theme === "dark"
                ? "bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700"
                : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
            }`}
          >
            <div className="text-center sm:text-left">
              <h3
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Ready to start saving money?
              </h3>
              <p
                className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                Join thousands of smart shoppers already using PricePulse
              </p>
            </div>

            <a
              href="#track-product"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:transform hover:scale-105 whitespace-nowrap"
            >
              Get Started Free
              <ArrowUpDown className="ml-2 h-5 w-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
