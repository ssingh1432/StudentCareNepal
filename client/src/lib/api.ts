import { apiRequest } from "./queryClient";
import { 
  Student, InsertStudent, 
  User, InsertUser, 
  Progress, InsertProgress, 
  TeachingPlan, InsertTeachingPlan
} from "@shared/schema";

// Student API
export const studentApi = {
  getStudents: async (filters?: { class?: string; teacherId?: number; learningAbility?: string }) => {
    let url = "/api/students";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.class) params.append("class", filters.class);
      if (filters.teacherId) params.append("teacherId", filters.teacherId.toString());
      if (filters.learningAbility) params.append("learningAbility", filters.learningAbility);
      if (params.toString()) url += `?${params.toString()}`;
    }
    const res = await apiRequest("GET", url);
    return await res.json() as Student[];
  },
  
  getStudent: async (id: number) => {
    const res = await apiRequest("GET", `/api/students/${id}`);
    return await res.json() as Student;
  },
  
  createStudent: async (student: FormData) => {
    const res = await fetch("/api/students", {
      method: "POST",
      body: student,
      credentials: "include"
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to create student");
    }
    
    return await res.json() as Student;
  },
  
  updateStudent: async (id: number, student: FormData) => {
    const res = await fetch(`/api/students/${id}`, {
      method: "PUT",
      body: student,
      credentials: "include"
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to update student");
    }
    
    return await res.json() as Student;
  },
  
  deleteStudent: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/students/${id}`);
    return res.status === 204;
  },
  
  assignStudent: async (studentId: number, teacherId: number) => {
    const res = await apiRequest("POST", `/api/students/${studentId}/assign`, { teacherId });
    return res.status === 200;
  }
};

// Teacher API
export const teacherApi = {
  getTeachers: async () => {
    const res = await apiRequest("GET", "/api/teachers");
    return await res.json() as User[];
  },
  
  createTeacher: async (teacher: InsertUser) => {
    const res = await apiRequest("POST", "/api/teachers", teacher);
    return await res.json() as User;
  },
  
  updateTeacher: async (id: number, teacher: Partial<User>) => {
    const res = await apiRequest("PUT", `/api/teachers/${id}`, teacher);
    return await res.json() as User;
  },
  
  deleteTeacher: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/teachers/${id}`);
    return res.status === 204;
  }
};

// Progress API
export const progressApi = {
  getStudentProgress: async (studentId: number) => {
    const res = await apiRequest("GET", `/api/progress/${studentId}`);
    return await res.json() as Progress[];
  },
  
  createProgress: async (progress: InsertProgress) => {
    const res = await apiRequest("POST", "/api/progress", progress);
    return await res.json() as Progress;
  },
  
  updateProgress: async (id: number, progress: Partial<Progress>) => {
    const res = await apiRequest("PUT", `/api/progress/${id}`, progress);
    return await res.json() as Progress;
  },
  
  deleteProgress: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/progress/${id}`);
    return res.status === 204;
  }
};

// Teaching Plan API
export const planApi = {
  getTeachingPlans: async (filters?: { type?: string; class?: string; teacherId?: number }) => {
    let url = "/api/teaching-plans";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.class) params.append("class", filters.class);
      if (filters.teacherId) params.append("teacherId", filters.teacherId.toString());
      if (params.toString()) url += `?${params.toString()}`;
    }
    const res = await apiRequest("GET", url);
    return await res.json() as TeachingPlan[];
  },
  
  getTeachingPlan: async (id: number) => {
    const res = await apiRequest("GET", `/api/teaching-plans/${id}`);
    return await res.json() as TeachingPlan;
  },
  
  createTeachingPlan: async (plan: InsertTeachingPlan) => {
    const res = await apiRequest("POST", "/api/teaching-plans", plan);
    return await res.json() as TeachingPlan;
  },
  
  updateTeachingPlan: async (id: number, plan: Partial<TeachingPlan>) => {
    const res = await apiRequest("PUT", `/api/teaching-plans/${id}`, plan);
    return await res.json() as TeachingPlan;
  },
  
  deleteTeachingPlan: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/teaching-plans/${id}`);
    return res.status === 204;
  },
  
  getAISuggestions: async (prompt: string) => {
    const res = await apiRequest("POST", "/api/ai-suggestions", { prompt });
    return await res.json() as { suggestion: string };
  }
};
