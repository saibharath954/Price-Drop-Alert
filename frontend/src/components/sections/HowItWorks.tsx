import { motion } from "framer-motion";
import {
  Search,
  Target,
  Bell,
  TrendingDown,
  ArrowRight,
  Link2,
  BarChart3,
  Mail,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const HowItWorks = () => {
  const { theme } = useTheme();

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: "easeInOut" } },
  };

  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Paste Product URL",
      description:
        "Simply copy and paste any Amazon product URL into our tracker. We support all major e-commerce platforms.",
      details: [
        "Amazon, Flipkart, eBay supported",
        "Instant product recognition",
        "Auto-fetch product details",
      ],
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      number: "02",
      icon: Target,
      title: "Set Price Target",
      description:
        "Enter your desired price point and email address. Our AI will monitor the product 24/7 for you.",
      details: [
        "Custom price alerts",
        "Email notifications",
        "Multiple target prices",
      ],
      color: "green",
      gradient: "from-green-500 to-green-600",
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Track & Analyze",
      description:
        "Watch real-time price changes with beautiful charts. Get insights on the best time to buy.",
      details: ["Live price charts", "Historical data", "Trend predictions"],
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      number: "04",
      icon: Bell,
      title: "Get Notified",
      description:
        "Receive instant alerts when prices drop below your target. Never miss a great deal again!",
      details: [
        "Instant email alerts",
        "Mobile notifications",
        "Deal recommendations",
      ],
      color: "orange",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const timeline = [
    {
      time: "Instantly",
      action: "Product Added",
      description: "Your product is added to our tracking system immediately",
      icon: Search,
    },
    {
      time: "Every Hour",
      action: "Price Check",
      description: "Automated price monitoring across all platforms",
      icon: Clock,
    },
    {
      time: "Price Drop",
      action: "Alert Sent",
      description: "Instant notification when your target price is reached",
      icon: TrendingDown,
    },
    {
      time: "Best Deal",
      action: "You Save!",
      description: "Purchase at the lowest price with confidence",
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      id="how-it-works"
      className={`py-20 relative overflow-hidden ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 ${
            theme === "dark" ? "bg-blue-500" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 ${
            theme === "dark" ? "bg-purple-500" : "bg-purple-400"
          }`}
        ></div>
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
                ? "bg-purple-900/50 text-purple-300"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            🚀 Simple Process
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
            How PricePulse
            <span
              className={`block ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
            >
              Works For You
            </span>
          </motion.h2>
        </div>

        {/* Timeline Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
          transition={{ delay: 0.1, ...itemVariants.visible.transition }}
          className={`rounded-3xl p-8 md:p-12
            ${
              theme === "dark"
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100"
            } shadow-2xl`}
        >
          <div className="text-center mb-12">
            <h3
              className={`text-3xl md:text-4xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Your Savings Timeline
            </h3>
            <p
              className={`text-lg md:text-xl ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              See how PricePulse works behind the scenes to save you money
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={itemVariants}
                transition={{
                  delay: index * 0.15,
                  ...itemVariants.visible.transition,
                }}
                className="relative group"
              >
                {/* Timeline connector (horizontal) */}
                {index < timeline.length - 1 && (
                  <div
                    className={`hidden lg:block absolute top-1/2 left-[calc(100%+16px)] w-[calc(100%-32px)] h-0.5
                      ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} z-0`}
                  >
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.6 }}
                      variants={lineVariants}
                      transition={{
                        delay: index * 0.2 + 0.6,
                        ...lineVariants.visible.transition,
                      }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 origin-left"
                    />
                  </div>
                )}

                <div
                  className={`flex flex-col items-center text-center p-6 rounded-xl border
                  ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}
                  shadow-md hover:shadow-lg transition-all duration-300 ease-in-out
                  group-hover:transform group-hover:-translate-y-1 group-hover:scale-[1.02]`}
                >
                  {/* Icon */}
                  <motion.div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4
                      shadow-lg border-4 border-blue-500
                      ${theme === "dark" ? "bg-gray-900 border-blue-600" : "bg-white"}
                      z-10`} // Ensure icon is on top
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <item.icon
                      className={`h-7 w-7 text-blue-500 group-hover:text-purple-500 transition-colors duration-300`}
                    />
                  </motion.div>

                  <span
                    className={`text-xs font-semibold mb-2 px-4 py-1 rounded-full
                      tracking-wide uppercase
                      ${
                        theme === "dark"
                          ? "bg-blue-900/60 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {item.time}
                  </span>

                  <h4
                    className={`font-extrabold text-lg mb-2 leading-tight ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }
                      group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300`}
                  >
                    {item.action}
                  </h4>

                  <p
                    className={`text-sm leading-relaxed ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-16"
        >
          <div
            className={`inline-flex flex-col sm:flex-row items-center gap-6 p-8 rounded-2xl ${
              theme === "dark"
                ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-gray-700"
                : "bg-gradient-to-r from-blue-600 to-purple-600"
            } shadow-2xl`}
          >
            <div className="text-center sm:text-left text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Start Saving?</h3>
              <p className="text-blue-100">
                Join thousands of smart shoppers and never overpay again
              </p>
            </div>

            <a
              href="#track-product"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 whitespace-nowrap"
            >
              Start Tracking Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
