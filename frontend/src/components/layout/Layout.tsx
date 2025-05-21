
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useTheme } from "@/hooks/useTheme";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex flex-col min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} transition-colors duration-300`}>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};
