import { apiRequest } from "./queryClient";
import { 
  User, Student, StudentFormData, 
  ProgressEntry, ProgressEntryFormData,
  TeachingPlan, TeachingPlanFormData,
  StudentFilters, ProgressFilters, PlanFilters,
  AISuggestionRequest, AISuggestionResponse,
  StudentReportOptions, PlanReportOptions,
  DashboardStats, UserFormData
} from "@/types";

// Auth API
export async function login(email: string, password: string) {
  const res = await apiRequest('POST', '/api/auth/login', { email, password });
  return await res.json();
}

// Teacher API
export async function createTeacher(data: UserFormData) {
  const res = await apiRequest('POST', '/api/teachers', data);
  return await res.json();
}

export async function updateTeacher(id: number, data: Partial<UserFormData>) {
  const res = await apiRequest('PUT', `/api/teachers/${id}`, data);
  return await res.json();
}

export async function deleteTeacher(id: number) {
  const res = await apiRequest('DELETE', `/api/teachers/${id}`);
  return await res.json();
}

export async function resetTeacherPassword(id: number, newPassword: string) {
  const res = await apiRequest('POST', `/api/teachers/${id}/reset-password`, { newPassword });
  return await res.json();
}

// Student API
export async function createStudent(data: StudentFormData) {
  const res = await apiRequest('POST', '/api/students', data);
  return await res.json();
}

export async function updateStudent(id: number, data: Partial<StudentFormData>) {
  const res = await apiRequest('PUT', `/api/students/${id}`, data);
  return await res.json();
}

export async function deleteStudent(id: number) {
  const res = await apiRequest('DELETE', `/api/students/${id}`);
  return await res.json();
}

export async function assignStudentToTeacher(studentId: number, teacherId: number) {
  const res = await apiRequest('POST', `/api/students/${studentId}/assign`, { teacherId });
  return await res.json();
}

// Progress API
export async function createProgressEntry(data: ProgressEntryFormData) {
  const res = await apiRequest('POST', '/api/progress', data);
  return await res.json();
}

export async function updateProgressEntry(id: number, data: Partial<ProgressEntryFormData>) {
  const res = await apiRequest('PUT', `/api/progress/${id}`, data);
  return await res.json();
}

export async function deleteProgressEntry(id: number) {
  const res = await apiRequest('DELETE', `/api/progress/${id}`);
  return await res.json();
}

// Teaching Plan API
export async function createTeachingPlan(data: TeachingPlanFormData) {
  const res = await apiRequest('POST', '/api/plans', data);
  return await res.json();
}

export async function updateTeachingPlan(id: number, data: Partial<TeachingPlanFormData>) {
  const res = await apiRequest('PUT', `/api/plans/${id}`, data);
  return await res.json();
}

export async function deleteTeachingPlan(id: number) {
  const res = await apiRequest('DELETE', `/api/plans/${id}`);
  return await res.json();
}

// AI Suggestions API
export async function getAISuggestions(data: AISuggestionRequest): Promise<AISuggestionResponse> {
  const res = await apiRequest('POST', '/api/ai/suggestions', data);
  return await res.json();
}

// Report Generation API
export async function generateStudentPdfReport(options: StudentReportOptions): Promise<Blob> {
  const res = await apiRequest('POST', '/api/reports/students/pdf', options);
  return await res.blob();
}

export async function generateStudentExcelReport(options: StudentReportOptions): Promise<Blob> {
  const res = await apiRequest('POST', '/api/reports/students/excel', options);
  return await res.blob();
}

export async function generatePlanPdfReport(options: PlanReportOptions): Promise<Blob> {
  const res = await apiRequest('POST', '/api/reports/plans/pdf', options);
  return await res.blob();
}

export async function generatePlanExcelReport(options: PlanReportOptions): Promise<Blob> {
  const res = await apiRequest('POST', '/api/reports/plans/excel', options);
  return await res.blob();
}

// Dashboard Stats API
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiRequest('GET', '/api/stats');
  return await res.json();
}
