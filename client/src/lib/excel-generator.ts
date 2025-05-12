import * as XLSX from 'xlsx';
import { Student, Progress, TeachingPlan } from '@shared/schema';

// Generate Excel file for student progress
export function generateStudentProgressExcel(
  students: Student[],
  progressEntries: Record<number, Progress[]>
): Blob {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create students worksheet
  const studentsData = students.map(student => ({
    'ID': student.id,
    'Name': student.name,
    'Class': student.class,
    'Age': student.age,
    'Learning Ability': student.learningAbility,
    'Writing Speed': student.writingSpeed,
    'Parent Contact': student.parentContact || 'N/A',
    'Notes': student.notes || ''
  }));
  
  const studentsWs = XLSX.utils.json_to_sheet(studentsData);
  XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');
  
  // Create progress worksheet
  const progressData: any[] = [];
  
  Object.entries(progressEntries).forEach(([studentId, entries]) => {
    const student = students.find(s => s.id === parseInt(studentId));
    
    if (student) {
      entries.forEach(entry => {
        progressData.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Class': student.class,
          'Date': new Date(entry.date).toLocaleDateString(),
          'Social Skills': entry.socialSkills,
          'Pre-Literacy': entry.preLiteracy,
          'Pre-Numeracy': entry.preNumeracy,
          'Motor Skills': entry.motorSkills,
          'Emotional Development': entry.emotionalDevelopment,
          'Comments': entry.comments || ''
        });
      });
    }
  });
  
  const progressWs = XLSX.utils.json_to_sheet(progressData);
  XLSX.utils.book_append_sheet(wb, progressWs, 'Progress');
  
  // Create summary worksheet
  const summaryData = students.map(student => {
    const studentProgress = progressEntries[student.id] || [];
    const latestProgress = studentProgress.length > 0 
      ? studentProgress.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    
    return {
      'Name': student.name,
      'Class': student.class,
      'Age': student.age,
      'Learning Ability': student.learningAbility,
      'Writing Speed': student.writingSpeed,
      'Latest Social Skills': latestProgress?.socialSkills || 'No data',
      'Latest Pre-Literacy': latestProgress?.preLiteracy || 'No data',
      'Latest Pre-Numeracy': latestProgress?.preNumeracy || 'No data',
      'Latest Motor Skills': latestProgress?.motorSkills || 'No data',
      'Latest Emotional Dev.': latestProgress?.emotionalDevelopment || 'No data',
      'Progress Entries Count': studentProgress.length
    };
  });
  
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Write file and return as blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buf], { type: 'application/octet-stream' });
}

// Generate Excel file for teaching plans
export function generateTeachingPlansExcel(
  plans: TeachingPlan[]
): Blob {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create plans worksheet
  const plansData = plans.map(plan => ({
    'ID': plan.id,
    'Title': plan.title,
    'Type': plan.type,
    'Class': plan.class,
    'Start Date': new Date(plan.startDate).toLocaleDateString(),
    'End Date': new Date(plan.endDate).toLocaleDateString(),
    'Description': plan.description,
  }));
  
  const plansWs = XLSX.utils.json_to_sheet(plansData);
  XLSX.utils.book_append_sheet(wb, plansWs, 'Plans Overview');
  
  // Create detailed worksheets by class
  const classesPlan: Record<string, TeachingPlan[]> = {
    'Nursery': plans.filter(p => p.class === 'Nursery'),
    'LKG': plans.filter(p => p.class === 'LKG'),
    'UKG': plans.filter(p => p.class === 'UKG')
  };
  
  Object.entries(classesPlan).forEach(([className, classPlans]) => {
    if (classPlans.length > 0) {
      const detailedData = classPlans.map(plan => ({
        'Title': plan.title,
        'Type': plan.type,
        'Duration': `${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`,
        'Description': plan.description,
        'Activities': plan.activities,
        'Goals': plan.goals
      }));
      
      const ws = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, ws, className);
    }
  });
  
  // Create a worksheet by plan type
  const typesPlan: Record<string, TeachingPlan[]> = {
    'Annual': plans.filter(p => p.type === 'Annual'),
    'Monthly': plans.filter(p => p.type === 'Monthly'),
    'Weekly': plans.filter(p => p.type === 'Weekly')
  };
  
  Object.entries(typesPlan).forEach(([typeName, typePlans]) => {
    if (typePlans.length > 0) {
      const typeData = typePlans.map(plan => ({
        'Title': plan.title,
        'Class': plan.class,
        'Duration': `${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`,
        'Description': plan.description,
        'Activities': plan.activities,
        'Goals': plan.goals
      }));
      
      const ws = XLSX.utils.json_to_sheet(typeData);
      XLSX.utils.book_append_sheet(wb, ws, typeName + ' Plans');
    }
  });
  
  // Write file and return as blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buf], { type: 'application/octet-stream' });
}
