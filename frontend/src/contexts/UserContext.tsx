
import React, { createContext, useState, useContext, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Mock auth for frontend implementation
// In a real app, this would be replaced with Firebase, Supabase, etc.

type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock user data - would be replaced with actual DB data
const mockUsers = [
  {
    id: "user1",
    email: "demo@pricepulse.com",
    password: "password123",
    name: "Demo User",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    trackedProducts: ["product1", "product2", "product3"]
  }
];

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("pricepulse_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("pricepulse_user");
      }
    }
    setLoading(false);
  }, []);

  // Mock login function - replace with actual auth in production
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error("Invalid email or password");
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("pricepulse_user", JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Welcome back!",
        description: `You've successfully logged in as ${userWithoutPassword.name}`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock Google login
  const loginWithGoogle = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the first mock user for demo purposes
      const { password: _, ...userWithoutPassword } = mockUsers[0];
      setUser(userWithoutPassword);
      localStorage.setItem("pricepulse_user", JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Google login successful!",
        description: `Welcome, ${userWithoutPassword.name}`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message || "There was an error signing in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock signup function
  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (mockUsers.some(u => u.email === email)) {
        throw new Error("Email already in use");
      }
      
      // Create new user
      const newUser = {
        id: `user${Date.now()}`,
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      };
      
      setUser(newUser);
      localStorage.setItem("pricepulse_user", JSON.stringify(newUser));
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to PricePulse",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pricepulse_user");
    toast({
      title: "Logged out successfully",
    });
    navigate("/");
  };

  // Mock forgot password function
  const forgotPassword = async (email: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email exists
      const userExists = mockUsers.some(u => u.email === email);
      
      if (!userExists) {
        throw new Error("Email not found");
      }
      
      toast({
        title: "Password reset email sent",
        description: "Please check your inbox for instructions",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "There was an error sending the reset email",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    forgotPassword,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
