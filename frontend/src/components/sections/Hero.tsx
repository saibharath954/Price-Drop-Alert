import { useState, useEffect } from "react";
import { motion, useTransform, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  TrendingUp,
  RefreshCw,
  Bell,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const Hero = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("amazon");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Enhanced parallax effects
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const imageRotate = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);

  // Smooth spring animations
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const smoothImageY = useSpring(imageY, springConfig);
  const smoothImageRotate = useSpring(imageRotate, springConfig);
  const smoothImageScale = useSpring(imageScale, springConfig);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateY: -15 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 1.2,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
    hover: {
      scale: 1.02,
      rotateY: 5,
      transition: { duration: 0.3 },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={{ y: backgroundY }}
          className={`absolute inset-0 transition-all duration-700 ${
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
              : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
          }`}
        />

        {/* Enhanced floating orbs with better positioning */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full filter blur-3xl ${
            theme === "dark"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 opacity-20"
              : "bg-gradient-to-r from-blue-400 to-cyan-300 opacity-30"
          }`}
        />

        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className={`absolute top-3/4 right-1/4 w-80 h-80 rounded-full filter blur-3xl ${
            theme === "dark"
              ? "bg-gradient-to-r from-purple-600 to-pink-500 opacity-20"
              : "bg-gradient-to-r from-purple-400 to-pink-300 opacity-25"
          }`}
        />

        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className={`absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full filter blur-3xl ${
            theme === "dark"
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 opacity-20"
              : "bg-gradient-to-r from-emerald-400 to-teal-300 opacity-25"
          }`}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeInOut",
            }}
            className={`absolute w-2 h-2 rounded-full ${
              theme === "dark" ? "bg-blue-400" : "bg-blue-500"
            }`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${60 + i * 5}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
        >
          {/* Left content section */}
          <div className="flex flex-col">
            <motion.div variants={itemVariants} className="mb-6">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-blue-900/50 text-blue-200 border border-blue-800/50 hover:bg-blue-800/50"
                    : "bg-blue-100/80 text-blue-700 border border-blue-200/50 hover:bg-blue-200/80"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI-Powered Price Analytics
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col"
            >
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight">
                Track & Compare Prices.
                <span
                  className={`${theme === "dark" ? "text-blue-400" : "text-blue-600"} block mt-2`}
                >
                  Never Overpay Again.
                </span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className={`mt-6 text-lg md:text-xl leading-relaxed max-w-2xl ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              PricePulse monitors product prices across e-commerce sites and
              alerts you when prices drop. Save money and shop smarter with
              real-time price tracking and AI-driven insights.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <motion.a
                href="#track-product"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20"
                  initial={false}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center justify-center px-8 py-4 border-2 text-base font-medium rounded-xl backdrop-blur-sm transition-all duration-300 ${
                  theme === "dark"
                    ? "border-gray-600/50 text-gray-200 hover:bg-gray-800/50 hover:border-gray-500/50"
                    : "border-gray-300/50 text-gray-700 hover:bg-gray-50/50 hover:border-gray-400/50"
                }`}
              >
                How It Works
              </motion.a>
            </motion.div>

            {/* Enhanced trust signals */}
            <motion.div
              variants={itemVariants}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                {
                  icon: ShoppingBag,
                  number: "5,000+",
                  label: "Active Users",
                  color: "blue",
                },
                {
                  icon: Star,
                  number: "4.9/5",
                  label: "Rating",
                  color: "yellow",
                },
                {
                  icon: TrendingUp,
                  number: "10M+",
                  label: "Prices Tracked",
                  color: "green",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`flex flex-col items-center text-center p-4 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50"
                      : "bg-white/30 hover:bg-white/50 border border-gray-200/50"
                  }`}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`p-3 rounded-full mb-3 ${
                      theme === "dark" ? "bg-gray-700/50" : "bg-gray-100/50"
                    }`}
                  >
                    <item.icon className={`h-6 w-6 text-${item.color}-500`} />
                  </motion.div>
                  <span
                    className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                  >
                    {item.number}
                  </span>
                  <span
                    className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Enhanced right image section */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="flex justify-center lg:justify-end mt-8 lg:mt-0 perspective-1000"
          >
            <motion.div
              style={{
                y: smoothImageY,
                x: smoothImageRotate,
                scale: smoothImageScale,
                rotateY: mousePosition.x * 0.1,
                rotateX: mousePosition.y * 0.1,
              }}
              className={`relative w-full max-w-lg lg:max-w-xl h-80 md:h-96 lg:h-[28rem] rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 shadow-blue-500/10"
                  : "bg-gradient-to-br from-white to-blue-50 shadow-blue-500/20"
              }`}
            >
              {/* Animated border gradient */}
              <motion.div
                className="absolute inset-0 rounded-2xl p-0.5"
                animate={{
                  background: theme === "dark" ? [] : [],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className={`w-full h-full rounded-2xl ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                />
              </motion.div>

              {/* Main image with enhanced effects */}
              <motion.div
                className="absolute inset-2 rounded-xl overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://buyhatke.com/_app/immutable/assets/ic_multi_store.D1gUxGvc.webp"
                  alt="Multi-store price comparison illustration"
                  className={`w-full h-full object-contain transition-all duration-700 ${
                    theme === "dark"
                      ? "filter brightness-110 contrast-105"
                      : "filter brightness-100"
                  }`}
                />

                {/* Enhanced overlay */}
                <motion.div
                  className={`absolute inset-0 transition-all duration-700 ${
                    theme === "dark"
                      ? "bg-gradient-to-t from-gray-900/10 via-transparent to-blue-900/5"
                      : "bg-gradient-to-t from-blue-50/20 via-transparent to-purple-50/10"
                  }`}
                  animate={{ opacity: [0.3, 0.1, 0.3] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Floating UI elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-lg backdrop-blur-sm ${
                    theme === "dark"
                      ? "bg-green-900/20 text-green-400"
                      : "bg-green-100/80 text-green-600"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className={`absolute bottom-4 left-4 p-2 rounded-lg backdrop-blur-sm ${
                    theme === "dark"
                      ? "bg-blue-900/20 text-blue-400"
                      : "bg-blue-100/80 text-blue-600"
                  }`}
                >
                  <RefreshCw
                    className="w-4 h-4 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </motion.div>
              </motion.div>

              {/* Glow effect */}
              <motion.div
                className={`absolute -inset-1 rounded-2xl blur-sm transition-all duration-700 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"
                    : "bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30"
                }`}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ zIndex: -1 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
