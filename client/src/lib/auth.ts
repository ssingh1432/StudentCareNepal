import { User } from '@shared/schema';
import { apiRequest } from './queryClient';

// Interface for login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface for registration data
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  role?: string;
  assignedClasses?: string[];
}

// Function to perform login
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await apiRequest('POST', '/api/login', credentials);
  const userData = await response.json();
  return userData;
};

// Function to perform logout
export const logout = async (): Promise<void> => {
  await apiRequest('POST', '/api/logout');
};

// Function to register a new user
export const register = async (data: RegistrationData): Promise<User> => {
  const response = await apiRequest('POST', '/api/register', data);
  const userData = await response.json();
  return userData;
};

// Function to get the current user (for initial auth check)
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated
        return null;
      }
      throw new Error('Failed to fetch current user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Helper function to check if user is an admin
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

// Helper function to check if a user has access to a specific class
export const hasClassAccess = (user: User | null, className: string): boolean => {
  if (!user) return false;
  
  // Admins have access to all classes
  if (user.role === 'admin') return true;
  
  // Check if the teacher is assigned to this class
  return Array.isArray(user.assignedClasses) && user.assignedClasses.includes(className);
};

// Function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  // In a real app, this would check for a valid session or token
  // For now, we'll use a simple check to see if we have user data in localStorage
  return localStorage.getItem('authenticated') === 'true';
};
