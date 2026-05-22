"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { api } from "@/lib/api";
import { FarmerProfile, User } from "@/types";

type AuthUser =
  | { type: "technician"; data: User }
  | { type: "farmer"; data: FarmerProfile };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loginTechnician: (email: string, password: string) => Promise<boolean>;
  loginFarmer: (farmerId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isOnline: boolean;
  isTechnician: () => boolean;
  isFarmer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const storedToken = localStorage.getItem("sf_token");
    const storedUser = localStorage.getItem("sf_user");
    const storedFarmer = localStorage.getItem("sf_farmer");

    if (storedToken) {
      if (storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        const userObj = parsed.user || parsed;
        // Mapeo automático de rol del backend a tipo de frontend
        setUser({ 
          type: userObj.role === 'CAMPESINO' ? 'farmer' : 'technician', 
          data: userObj 
        });
      } else if (storedFarmer) {
        setToken(storedToken);
        const parsed = JSON.parse(storedFarmer);
        const farmerObj = parsed.farmer || parsed;
        setUser({ type: "farmer", data: farmerObj });
      }
    }

    setIsLoading(false);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function loginTechnician(email: string, password: string): Promise<boolean> {
    try {
      const result = await api.loginTechnician(email, password);

      if (result.token && result.user) {
        const sessionData = { 
          token: result.token, 
          user: result.user, 
          timestamp: new Date().getTime() 
        };
        localStorage.setItem("sf_token", result.token);
        localStorage.setItem("sf_user", JSON.stringify(sessionData));
        localStorage.removeItem("sf_farmer");
        setToken(result.token);
        setUser({ type: "technician", data: result.user });
        return true;
      }
      return false;
    } catch (error: any) {
      if (error && error.status !== 401 && error.status !== 400) {
        console.error("Login technician error:", error);
      }
      throw error;
    }
  }
 
  async function loginFarmer(farmerId: string, pin: string): Promise<boolean> {
    try {
      const result = await api.loginFarmer(farmerId, pin);
 
      if (result.token && result.farmer) {
        const sessionData = { 
          token: result.token, 
          farmer: result.farmer, 
          timestamp: new Date().getTime() 
        };
        localStorage.setItem("sf_token", result.token);
        localStorage.setItem("sf_farmer", JSON.stringify(sessionData));
        localStorage.removeItem("sf_user");
        setToken(result.token);
        setUser({ type: "farmer", data: result.farmer });
        return true;
      }
      return false;
    } catch (error: any) {
      if (error && error.status !== 401 && error.status !== 400) {
        console.error("Login farmer error:", error);
      }
      throw error;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    localStorage.removeItem("sf_farmer");
  }

  const isTechnician = () => user?.type === "technician";
  const isFarmer = () => user?.type === "farmer";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loginTechnician,
        loginFarmer,
        logout,
        isLoading,
        isOnline,
        isTechnician,
        isFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
