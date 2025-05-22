import { motion } from "framer-motion";
import {
  Star,
  Quote,
  ShoppingBag,
  TrendingDown,
  Heart,
  Award,
  Users,
  DollarSign,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const Testimonials = () => {
  const { theme } = useTheme();

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Tech Enthusiast",
      location: "Mumbai, India",
      image: "/api/placeholder/64/64",
      rating: 5,
      savings: "₹15,000",
      content:
        "PricePulse saved me thousands on my laptop purchase! The price alerts are incredibly accurate and the historical data helped me identify the perfect buying window. Best shopping tool I've ever used!",
      highlight: "Saved ₹15K on laptop",
      verified: true,
      category: "electronics",
    },
    {
      name: "Rajesh Kumar",
      role: "Small Business Owner",
      location: "Delhi, India",
      image: "/api/placeholder/64/64",
      rating: 5,
      savings: "₹50,000",
      content:
        "As a business owner, every rupee counts. PricePulse helps me track bulk purchase prices across platforms. The multi-platform comparison feature is a game-changer for procurement decisions.",
      highlight: "50K+ saved on bulk orders",
      verified: true,
      category: "business",
    },
    {
      name: "Priya Sharma",
      role: "Fashion Blogger",
      location: "Bangalore, India",
      image: "/api/placeholder/64/64",
      rating: 5,
      savings: "₹8,500",
      content:
        "I track fashion items across multiple platforms and PricePulse makes it so easy! The AI-powered search finds the exact products on different sites. Love the clean interface and instant notifications.",
      highlight: "Never misses fashion deals",
      verified: true,
      category: "fashion",
    },
    {
      name: "Amit Patel",
      role: "Software Engineer",
      location: "Pune, India",
      image: "/api/placeholder/64/64",
      rating: 5,
      savings: "₹12,000",
      content:
        "The automation is flawless! Set it once and forget it. I've saved on everything from gadgets to home appliances. The price prediction feature helped me wait for the right moment to buy.",
      highlight: "Automated savings expert",
      verified: true,
      category: "tech",
    },
  ];

  const stats = [
    {
      icon: Users,
      number: "50K+",
      label: "Happy Users",
      color: "text-blue-500",
      description: "Smart shoppers trust PricePulse",
    },
    {
      icon: DollarSign,
      number: "₹2Cr+",
      label: "Total Savings",
      color: "text-green-500",
      description: "Money saved by our community",
    },
    {
      icon: TrendingDown,
      number: "40%",
      label: "Average Savings",
      color: "text-purple-500",
      description: "On tracked products",
    },
    {
      icon: Award,
      number: "4.9★",
      label: "User Rating",
      color: "text-yellow-500",
      description: "Based on 10K+ reviews",
    },
  ];

  const categories = [
    { name: "Electronics", count: "15K+ products", icon: "💻" },
    { name: "Fashion", count: "25K+ products", icon: "👗" },
    { name: "Home & Kitchen", count: "12K+ products", icon: "🏠" },
    { name: "Books", count: "8K+ products", icon: "📚" },
    { name: "Sports", count: "6K+ products", icon: "⚽" },
    { name: "Beauty", count: "10K+ products", icon: "💄" },
  ];

  return (
    <section
      id="testimonials"
      className={`py-20 relative overflow-hidden ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-50"
      }`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div
          className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10 ${
            theme === "dark" ? "bg-green-500" : "bg-green-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-10 ${
            theme === "dark" ? "bg-blue-500" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-5 ${
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
                ? "bg-green-900/50 text-green-300"
                : "bg-green-100 text-green-700"
            }`}
          >
            ❤️ Loved by thousands
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
            What Our Users
            <span
              className={`block ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
            >
              Are Saying
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
            Join thousands of smart shoppers who are already saving money with
            PricePulse. Here's what they have to say.
          </motion.p>
        </div>

        {/* Stats Section */}
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
              className={`text-center p-6 rounded-2xl ${
                theme === "dark" ? "bg-gray-900/50" : "bg-white/80"
              } backdrop-blur-sm border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              } shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105`}
            >
              <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color}`} />
              <div
                className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {stat.number}
              </div>
              <div
                className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                {stat.label}
              </div>
              <div
                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                {stat.description}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative p-8 rounded-2xl ${
                theme === "dark"
                  ? "bg-gray-900/80 border border-gray-700 hover:border-gray-600 hover:bg-gray-900"
                  : "bg-white border border-gray-100 hover:border-gray-200 hover:bg-white"
              } shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm`}
            >
              {/* Quote Icon */}
              <Quote
                className={`absolute top-4 right-4 h-8 w-8 ${
                  theme === "dark" ? "text-gray-700" : "text-gray-200"
                } group-hover:text-green-500 transition-colors duration-300`}
              />

              {/* Savings Badge */}
              <div
                className={`absolute -top-3 -left-3 px-3 py-1 rounded-full text-xs font-bold ${
                  theme === "dark"
                    ? "bg-green-900 text-green-300"
                    : "bg-green-500 text-white"
                } shadow-lg`}
              >
                Saved {testimonial.savings}
              </div>

              {/* Header */}
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 border-2 border-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      {testimonial.name}
                    </h4>
                    {testimonial.verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
                <span
                  className={`ml-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  {testimonial.rating}.0
                </span>
              </div>

              {/* Content */}
              <p
                className={`mb-6 leading-relaxed ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                "{testimonial.content}"
              </p>

              {/* Highlight */}
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Heart className="h-3 w-3 mr-1 text-red-500" />
                {testimonial.highlight}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`rounded-3xl p-8 md:p-12 ${
            theme === "dark"
              ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
              : "bg-gradient-to-br from-green-50 to-blue-50 border border-green-100"
          }`}
        >
          <div className="text-center mb-8">
            <h3
              className={`text-2xl md:text-3xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Track Products Across All Categories
            </h3>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              From electronics to fashion, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`text-center p-4 rounded-xl ${
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-white hover:bg-gray-50"
                } shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 border ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <h4
                  className={`font-semibold text-sm mb-1 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {category.name}
                </h4>
                <p
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {category.count}
                </p>
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
            className={`inline-flex flex-col items-center gap-6 p-8 rounded-2xl ${
              theme === "dark"
                ? "bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-gray-700"
                : "bg-gradient-to-r from-green-600 to-blue-600"
            } shadow-2xl`}
          >
            <div className="text-center text-white">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-2xl font-bold mb-2">
                Join 50,000+ Happy Shoppers
              </h3>
              <p className="text-green-100 mb-6 max-w-md">
                Start saving money today with intelligent price tracking and
                instant deal alerts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#track-product"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                Start Tracking Free
                <TrendingDown className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-medium rounded-xl border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
