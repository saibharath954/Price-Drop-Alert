import { Layout } from "@/components/layout/Layout";
import { SignupForm } from "@/components/auth/SignupForm";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const Signup = () => {
  const { theme } = useTheme();

  return (
    <Layout>
      <div
        className={`min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 pt-24 overflow-hidden ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-blue-50"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <SignupForm />
        </motion.div>
      </div>
    </Layout>
  );
};

export default Signup;
