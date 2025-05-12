// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  classes: string[];
  createdAt: string;
}

export interface UserFormData {
  email: string;
  name: string;
  password?: string;
  classes?: string[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Student types
export interface Student {
  id: number;
  name: string;
  age: number;
  class: string;
  parentContact?: string;
  learningAbility: string;
  writingSpeed?: string;
  notes?: string;
  photoUrl?: string;
  teacherId?: number;
  createdAt: string;
  teacherName?: string;
}

export interface StudentFormData {
  name: string;
  age: number;
  class: string;
  parentContact?: string;
  learningAbility: string;
  writingSpeed?: string;
  notes?: string;
  photoUrl?: string;
  teacherId?: number;
}

export interface StudentFilters {
  class?: string;
  teacherId?: number | string;
  learningAbility?: string;
  search?: string;
}

// Progress types
export interface ProgressEntry {
  id: number;
  studentId: number;
  date: string;
  socialSkills: string;
  preLiteracy: string;
  preNumeracy: string;
  motorSkills: string;
  emotionalDevelopment: string;
  comments?: string;
  createdAt: string;
  studentName?: string;
  studentClass?: string;
  studentPhotoUrl?: string;
}

export interface ProgressEntryFormData {
  studentId: number;
  date: string;
  socialSkills: string;
  preLiteracy: string;
  preNumeracy: string;
  motorSkills: string;
  emotionalDevelopment: string;
  comments?: string;
}

export interface ProgressFilters {
  studentId?: number;
  class?: string;
  date?: string;
}

// Teaching Plan types
export interface TeachingPlan {
  id: number;
  type: string;
  class: string;
  title: string;
  description: string;
  activities: string;
  goals: string;
  startDate: string;
  endDate: string;
  teacherId: number;
  createdAt: string;
  teacherName?: string;
}

export interface TeachingPlanFormData {
  type: string;
  class: string;
  title: string;
  description: string;
  activities: string;
  goals: string;
  startDate: string;
  endDate: string;
}

export interface PlanFilters {
  type?: string;
  class?: string;
  teacherId?: number | string;
  search?: string;
}

// Report types
export interface StudentReportOptions {
  className: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  includePhotos: boolean;
}

export interface PlanReportOptions {
  type: string;
  className: string;
  teacherId: string;
}

// Stats types
export interface DashboardStats {
  students: {
    total: number;
    nursery: number;
    lkg: number;
    ukg: number;
  };
  teachers: number;
  progressEntries: number;
  plans: {
    total: number;
    annual: number;
    monthly: number;
    weekly: number;
  };
}

// Form option types
export interface SelectOption {
  value: string;
  label: string;
}

// File upload types
export interface CloudinaryResponse {
  url: string;
  public_id: string;
}

// AI Suggestion types
export interface AISuggestionRequest {
  prompt: string;
  className: string;
  planType: string;
}

export interface AISuggestionResponse {
  suggestions: string;
}
