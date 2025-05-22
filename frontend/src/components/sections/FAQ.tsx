import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Plus,
  Minus,
  HelpCircle,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  Mail,
  CreditCard,
  Smartphone,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const FAQ = () => {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Directly define the 5 questions without categories
  const faqs = [
    {
      question: "Is PricePulse completely free to use?",
      answer:
        "Yes! PricePulse is completely free with no hidden charges. You can track unlimited products, set price alerts, and access all features without paying anything. We believe everyone deserves to save money on their purchases.",
      color: "blue", // Assign a color for the icon, can be dynamic or static
    },
    {
      question: "How accurate is the price tracking?",
      answer:
        "Our price tracking has 99.9% accuracy. We use advanced scraping techniques and multiple verification methods to ensure the prices we show are correct. If you ever notice a discrepancy, please report it and we'll fix it immediately.",
      color: "green",
    },
    {
      question: "What if I miss a price drop notification?",
      answer:
        "Don't worry! We keep a history of all price changes and notifications sent. You can view missed opportunities in your dashboard and set up backup alerts. We also send summary emails with all the deals you might have missed.",
      color: "purple",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "Yes! We never share your personal data with third parties. All communications are encrypted, and we're fully GDPR compliant. Your shopping habits, email address, and tracked products remain completely private and secure.",
      color: "red",
    },
    {
      question: "What if a product URL doesn't work?",
      answer:
        "If a URL isn't recognized, try copying the direct product page URL (not search results). Make sure it's from a supported platform. If it still doesn't work, contact our support team with the URL and we'll add support for it within 24 hours.",
      color: "orange",
    },
  ];

  // Map icon components to a string key for easier lookup
  const iconMap = {
    blue: Zap, // Getting Started
    green: Globe, // Price Tracking
    purple: Mail, // Alerts & Notifications
    red: ShieldCheck, // Privacy & Security
    orange: HelpCircle, // Technical Support
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const helpResources = [
    {
      icon: Search,
      title: "Video Tutorials",
      description: "Step-by-step guides to master PricePulse",
      action: "Watch Now",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help from our friendly support team",
      action: "Contact Us",
    },
    {
      icon: Smartphone,
      title: "Live Chat",
      description: "Instant help when you need it most",
      action: "Chat Now",
    },
  ];

  return (
    <section
      id="faq"
      className={`py-20 relative overflow-hidden ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 ${
            theme === "dark" ? "bg-blue-500" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 ${
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
                ? "bg-orange-900/50 text-orange-300"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            ❓ Got Questions?
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
            Frequently Asked
            <span
              className={`block ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}
            >
              Questions
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
            Everything you need to know about PricePulse. Can't find what you're
            looking for?
            <a
              href="#contact"
              className={`${theme === "dark" ? "text-orange-400" : "text-orange-600"} hover:underline ml-1`}
            >
              Contact our support team.
            </a>
          </motion.p>
        </div>

        {/* FAQ Items (without categories) */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const IconComponent =
              iconMap[faq.color as keyof typeof iconMap] || HelpCircle; // Fallback icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-2xl border ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-100 hover:border-gray-200"
                } shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between focus:outline-none group"
                >
                  <div className="flex items-center">
                    {" "}
                    {/* Added wrapper for icon and question */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-${faq.color}-500/10`}
                    >
                      <IconComponent
                        className={`h-5 w-5 text-${faq.color}-500`}
                      />
                    </div>
                    <h4
                      className={`text-lg font-semibold pr-8 ${
                        theme === "dark"
                          ? "text-white group-hover:text-orange-400"
                          : "text-gray-900 group-hover:text-orange-600"
                      } transition-colors duration-300`}
                    >
                      {faq.question}
                    </h4>
                  </div>

                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isOpen
                        ? `bg-${faq.color}-500 text-white`
                        : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                    } transition-all duration-300 group-hover:scale-110`}
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6">
                        <div
                          className={`h-px mb-6 ${
                            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        ></div>
                        <p
                          className={`leading-relaxed ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Help Resources */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`mt-20 rounded-3xl p-8 md:p-12 ${
            theme === "dark"
              ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
              : "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100"
          }`}
        >
          <div className="text-center mb-12">
            <h3
              className={`text-2xl md:text-3xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Need More Help?
            </h3>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Our support team is here to help you succeed with PricePulse
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {helpResources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`text-center p-6 rounded-2xl ${
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-white hover:bg-gray-50"
                } shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 border ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                } group cursor-pointer`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    theme === "dark" ? "bg-orange-900/50" : "bg-orange-100"
                  } group-hover:bg-orange-500 transition-all duration-300`}
                >
                  <resource.icon
                    className={`h-8 w-8 ${
                      theme === "dark"
                        ? "text-orange-400 group-hover:text-white"
                        : "text-orange-600 group-hover:text-white"
                    } transition-colors duration-300`}
                  />
                </div>

                <h4
                  className={`text-xl font-bold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {resource.title}
                </h4>

                <p
                  className={`mb-4 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {resource.description}
                </p>

                <button
                  className={`text-sm font-medium px-4 py-2 rounded-lg ${
                    theme === "dark"
                      ? "text-orange-400 hover:bg-orange-900/50"
                      : "text-orange-600 hover:bg-orange-50"
                  } transition-all duration-300`}
                >
                  {resource.action} →
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
