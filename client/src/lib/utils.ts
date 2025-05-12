import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert snake_case to Title Case
 */
export function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Utility to get the age from a birth year
 */
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

/**
 * Get the corresponding colors for rating labels
 */
export function getRatingColorClass(rating: string): string {
  switch (rating) {
    case "Excellent":
      return "bg-green-100 text-green-800";
    case "Good":
      return "bg-yellow-100 text-yellow-800";
    case "Needs Improvement":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get the corresponding colors for class labels
 */
export function getClassColorClass(className: string): string {
  switch (className) {
    case "Nursery":
      return "bg-purple-100 text-purple-800";
    case "LKG":
      return "bg-blue-100 text-blue-800";
    case "UKG":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get the corresponding colors for learning ability labels
 */
export function getLearningAbilityColorClass(ability: string): string {
  switch (ability) {
    case "Talented":
      return "bg-green-100 text-green-800";
    case "Average":
      return "bg-yellow-100 text-yellow-800";
    case "Slow Learner":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get the corresponding colors for writing speed labels
 */
export function getWritingSpeedColorClass(speed: string): string {
  switch (speed) {
    case "Speed Writing":
      return "bg-blue-100 text-blue-800";
    case "Slow Writing":
      return "bg-yellow-100 text-yellow-800";
    case "N/A":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get the corresponding colors for plan type labels
 */
export function getPlanTypeColorClass(type: string): string {
  switch (type) {
    case "Annual":
      return "bg-green-100 text-green-800";
    case "Monthly":
      return "bg-indigo-100 text-indigo-800";
    case "Weekly":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Group array items by a key property
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const keyValue = String(item[key]);
    if (!result[keyValue]) {
      result[keyValue] = [];
    }
    result[keyValue].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Check if a value is of a certain type
 */
export function isOfType<T>(value: any, properties: (keyof T)[]): value is T {
  return properties.every(prop => prop in value);
}

/**
 * Filter an array of objects by a search term
 */
export function filterBySearchTerm<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  keys: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return items.filter(item => 
    keys.some(key => {
      const value = item[key];
      return value && String(value).toLowerCase().includes(lowerSearchTerm);
    })
  );
}
