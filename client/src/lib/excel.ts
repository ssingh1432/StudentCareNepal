import * as XLSX from 'xlsx';
import { formatDate } from './utils';

// Function to generate Excel file from data
const generateExcel = (data: any[], sheetName: string, fileName: string): void => {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file
  XLSX.writeFile(workbook, fileName);
};

// Function to generate student progress Excel report
export const generateStudentProgressExcel = (
  students: any[],
  dateRange?: { from: string, to: string }
): void => {
  // Format student data for Excel
  const formattedData = students.map(student => ({
    'Name': student.name,
    'Class': student.class,
    'Age': student.age,
    'Learning Ability': student.learningAbility,
    'Writing Speed': student.writingSpeed === 'N/A' ? 'Not Applicable' : student.writingSpeed,
    'Teacher': student.teacherName || '',
    'Parent Contact': student.parentContact || ''
  }));
  
  // Generate filename with date range if provided
  let fileName = 'Student_Progress_Report';
  if (dateRange) {
    const fromDate = formatDate(dateRange.from).replace(/[/\s,]/g, '_');
    const toDate = formatDate(dateRange.to).replace(/[/\s,]/g, '_');
    fileName += `_${fromDate}_to_${toDate}`;
  }
  fileName += '.xlsx';
  
  // Generate Excel file
  generateExcel(formattedData, 'Student Progress', fileName);
};

// Function to generate progress entries Excel report for a student
export const generateStudentProgressEntriesExcel = (
  student: any,
  progressEntries: any[]
): void => {
  // Format progress entries for Excel
  const formattedData = progressEntries.map(entry => ({
    'Date': formatDate(entry.date),
    'Social Skills': entry.socialSkills,
    'Pre-Literacy': entry.preLiteracy,
    'Pre-Numeracy': entry.preNumeracy,
    'Motor Skills': entry.motorSkills,
    'Emotional Development': entry.emotionalDevelopment,
    'Comments': entry.comments || ''
  }));
  
  // Generate filename
  const studentName = student.name.replace(/\s+/g, '_');
  const fileName = `Progress_Entries_${studentName}.xlsx`;
  
  // Generate Excel file
  generateExcel(formattedData, 'Progress Entries', fileName);
};

// Function to generate teaching plans Excel report
export const generateTeachingPlansExcel = (
  plans: any[],
  className?: string,
  type?: string
): void => {
  // Format teaching plans for Excel
  const formattedData = plans.map(plan => ({
    'Title': plan.title,
    'Class': plan.class,
    'Type': plan.type,
    'Start Date': formatDate(plan.startDate),
    'End Date': formatDate(plan.endDate),
    'Description': plan.description,
    'Activities': plan.activities,
    'Goals': plan.goals,
    'Created By': plan.creatorName || ''
  }));
  
  // Generate filename
  let fileName = 'Teaching_Plans_Report';
  if (className) {
    fileName += `_${className}`;
  }
  if (type) {
    fileName += `_${type}`;
  }
  fileName += '.xlsx';
  
  // Generate Excel file
  generateExcel(formattedData, 'Teaching Plans', fileName);
};

// Function to generate class summary Excel report
export const generateClassSummaryExcel = (
  className: string,
  students: any[],
  progressSummary: any[]
): void => {
  // Student sheet data
  const studentData = students.map(student => ({
    'Name': student.name,
    'Age': student.age,
    'Learning Ability': student.learningAbility,
    'Writing Speed': student.writingSpeed === 'N/A' ? 'Not Applicable' : student.writingSpeed,
    'Teacher': student.teacherName || '',
    'Parent Contact': student.parentContact || ''
  }));
  
  // Progress summary sheet data
  const progressData = progressSummary.map(entry => ({
    'Student Name': entry.studentName,
    'Social Skills': entry.socialSkillsAvg,
    'Pre-Literacy': entry.preLiteracyAvg,
    'Pre-Numeracy': entry.preNumeracyAvg,
    'Motor Skills': entry.motorSkillsAvg,
    'Emotional Development': entry.emotionalDevAvg,
    'Overall': entry.overallAvg
  }));
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Add student sheet
  const studentSheet = XLSX.utils.json_to_sheet(studentData);
  XLSX.utils.book_append_sheet(workbook, studentSheet, 'Students');
  
  // Add progress summary sheet
  const progressSheet = XLSX.utils.json_to_sheet(progressData);
  XLSX.utils.book_append_sheet(workbook, progressSheet, 'Progress Summary');
  
  // Generate filename
  const fileName = `${className}_Class_Summary.xlsx`;
  
  // Generate Excel file
  XLSX.writeFile(workbook, fileName);
};

export default {
  generateStudentProgressExcel,
  generateStudentProgressEntriesExcel,
  generateTeachingPlansExcel,
  generateClassSummaryExcel
};
