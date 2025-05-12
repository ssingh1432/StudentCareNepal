import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, login as authLogin, logout as authLogout, getCurrentUser, isAuthenticated, register as authRegister } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  assignedClasses?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (credentials: LoginCredentials) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  registerMutation: {
    mutate: (data: RegisterData) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  logoutMutation: {
    mutate: () => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  // Get current user query
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      if (isAuthenticated()) {
        try {
          return await getCurrentUser();
        } catch (error) {
          console.error("Error checking authentication:", error);
          localStorage.removeItem("authenticated");
          return null;
        }
      }
      return null;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await authLogin(credentials);
    },
    onSuccess: (data) => {
      localStorage.setItem("authenticated", "true");
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return await authRegister(data);
    },
    onSuccess: (data) => {
      localStorage.setItem("authenticated", "true");
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authLogout();
      localStorage.removeItem("authenticated");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const value = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    error,
    loginMutation,
    registerMutation,
    logoutMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
