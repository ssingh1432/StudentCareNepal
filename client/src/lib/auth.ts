import { apiRequest } from "./queryClient";

// Define types
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "teacher";
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Login function
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }
  
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem("token", data.token);
  
  return data;
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem("token");
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return null;
  }
  
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to get user");
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    localStorage.removeItem("token");
    return null;
  }
};

// Get token from storage
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// Parse JWT token
export const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const parsedToken = parseJwt(token);
  if (!parsedToken) return true;
  
  const expiryTime = parsedToken.exp * 1000; // Convert to milliseconds
  return Date.now() >= expiryTime;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

// Check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === "admin";
};

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  isAdmin,
};
