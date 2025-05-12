import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatted date helper
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Class badge color mapping
export const getClassBadgeColor = (className: string) => {
  switch (className) {
    case 'Nursery':
      return 'yellow';
    case 'LKG':
      return 'blue';
    case 'UKG':
      return 'green';
    default:
      return 'gray';
  }
};

// Learning ability badge color mapping
export const getLearningAbilityBadgeColor = (ability: string) => {
  switch (ability) {
    case 'Talented':
      return 'green';
    case 'Average':
      return 'yellow';
    case 'Slow Learner':
      return 'red';
    default:
      return 'gray';
  }
};

// Writing speed badge color mapping
export const getWritingSpeedBadgeColor = (speed: string) => {
  switch (speed) {
    case 'Speed Writing':
      return 'blue';
    case 'Slow Writing':
      return 'yellow';
    default:
      return 'gray';
  }
};

// Progress rating badge color mapping
export const getProgressRatingBadgeColor = (rating: string) => {
  switch (rating) {
    case 'Excellent':
      return 'green';
    case 'Good':
      return 'yellow';
    case 'Needs Improvement':
      return 'red';
    default:
      return 'gray';
  }
};

// Plan type badge color mapping
export const getPlanTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'Annual':
      return 'green';
    case 'Monthly':
      return 'indigo';
    case 'Weekly':
      return 'yellow';
    default:
      return 'gray';
  }
};

// Truncate text
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Generate user initials from name
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Basic form validation helpers
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRequired = (value: string) => {
  return !!value.trim();
};

export const validatePhone = (phone: string) => {
  return /^\+?[0-9\s\-\(\)]{7,}$/.test(phone);
};

export const validateAge = (age: string) => {
  const parsedAge = parseInt(age);
  return !isNaN(parsedAge) && parsedAge >= 3 && parsedAge <= 5;
};

// Filter and search helpers
export const filterStudentsByClass = (students: any[], className: string) => {
  if (!className || className === 'all') return students;
  return students.filter(student => student.class === className);
};

export const searchStudentsByName = (students: any[], searchTerm: string) => {
  if (!searchTerm) return students;
  const term = searchTerm.toLowerCase();
  return students.filter(student => 
    student.name.toLowerCase().includes(term)
  );
};

// Object comparator
export const areObjectsEqual = (obj1: any, obj2: any) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};
