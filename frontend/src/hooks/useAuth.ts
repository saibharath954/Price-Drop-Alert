import { useEffect, useState } from "react";
import { getAuth, User } from "firebase/auth";
import { app } from "@/lib/firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
  };
};
