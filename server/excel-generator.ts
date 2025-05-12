import * as XLSX from 'xlsx';
import { Student, Progress, TeachingPlan } from '@shared/schema';

// Function to generate a student progress Excel report
export function generateStudentProgressExcel(
  students: Student[],
  progressRecords: Map<number, Progress[]>,
  className?: string
): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet for student data
  const studentData = students.map(student => ({
    'Name': student.name,
    'Class': student.class,
    'Age': student.age,
    'Learning Ability': student.learningAbility,
    'Writing Speed': student.writingSpeed || 'N/A',
    'Parent Contact': student.parentContact || 'N/A'
  }));
  
  const studentWs = XLSX.utils.json_to_sheet(studentData);
  XLSX.utils.book_append_sheet(workbook, studentWs, 'Students');
  
  // Create worksheet for latest progress
  const progressData = students.map(student => {
    const studentProgressEntries = progressRecords.get(student.id) || [];
    
    // Sort by date and get the latest entry
    const latestEntry = studentProgressEntries.length > 0 
      ? studentProgressEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    
    return {
      'Student Name': student.name,
      'Class': student.class,
      'Learning Ability': student.learningAbility,
      'Writing Speed': student.writingSpeed || 'N/A',
      'Latest Assessment Date': latestEntry ? new Date(latestEntry.date).toLocaleDateString() : 'No data',
      'Social Skills': latestEntry?.socialSkills || 'No data',
      'Pre-Literacy': latestEntry?.preLiteracy || 'No data',
      'Pre-Numeracy': latestEntry?.preNumeracy || 'No data',
      'Motor Skills': latestEntry?.motorSkills || 'No data',
      'Emotional Development': latestEntry?.emotionalDevelopment || 'No data',
      'Comments': latestEntry?.comments || ''
    };
  });
  
  const progressWs = XLSX.utils.json_to_sheet(progressData);
  XLSX.utils.book_append_sheet(workbook, progressWs, 'Latest Progress');
  
  // Create worksheet for all progress entries
  const allProgressData: any[] = [];
  
  students.forEach(student => {
    const studentProgressEntries = progressRecords.get(student.id) || [];
    
    studentProgressEntries.forEach(entry => {
      allProgressData.push({
        'Student Name': student.name,
        'Class': student.class,
        'Assessment Date': new Date(entry.date).toLocaleDateString(),
        'Social Skills': entry.socialSkills,
        'Pre-Literacy': entry.preLiteracy,
        'Pre-Numeracy': entry.preNumeracy,
        'Motor Skills': entry.motorSkills,
        'Emotional Development': entry.emotionalDevelopment,
        'Comments': entry.comments || ''
      });
    });
  });
  
  if (allProgressData.length > 0) {
    const allProgressWs = XLSX.utils.json_to_sheet(allProgressData);
    XLSX.utils.book_append_sheet(workbook, allProgressWs, 'All Progress Entries');
  }
  
  // Generate report title with filters
  let title = 'Student Progress Report';
  if (className) {
    title += ` - ${className}`;
  }
  title += ` (Generated: ${new Date().toLocaleDateString()})`;
  
  // Add report info sheet
  const reportInfoData = [
    { 'Report': title },
    { 'Report': `Total Students: ${students.length}` },
    { 'Report': `Generated On: ${new Date().toLocaleString()}` },
    { 'Report': 'Nepal Central High School, Narephat, Kathmandu' }
  ];
  
  const reportInfoWs = XLSX.utils.json_to_sheet(reportInfoData);
  XLSX.utils.book_append_sheet(workbook, reportInfoWs, 'Report Info');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

// Function to generate a teaching plan Excel report
export function generateTeachingPlanExcel(
  plans: TeachingPlan[],
  teacherNames: Map<number, string>,
  type?: string,
  className?: string
): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet for plan data
  const planData = plans.map(plan => ({
    'Title': plan.title,
    'Type': plan.type,
    'Class': plan.class,
    'Start Date': new Date(plan.startDate).toLocaleDateString(),
    'End Date': new Date(plan.endDate).toLocaleDateString(),
    'Teacher': teacherNames.get(plan.teacherId) || 'Unknown',
    'Created At': new Date(plan.createdAt).toLocaleDateString()
  }));
  
  const plansWs = XLSX.utils.json_to_sheet(planData);
  XLSX.utils.book_append_sheet(workbook, plansWs, 'Plans Overview');
  
  // Create detailed worksheet for each plan
  plans.forEach((plan, index) => {
    const detailedPlanData = [
      { 'Field': 'Title', 'Value': plan.title },
      { 'Field': 'Type', 'Value': plan.type },
      { 'Field': 'Class', 'Value': plan.class },
      { 'Field': 'Start Date', 'Value': new Date(plan.startDate).toLocaleDateString() },
      { 'Field': 'End Date', 'Value': new Date(plan.endDate).toLocaleDateString() },
      { 'Field': 'Teacher', 'Value': teacherNames.get(plan.teacherId) || 'Unknown' },
      { 'Field': 'Description', 'Value': plan.description },
      { 'Field': 'Activities', 'Value': plan.activities },
      { 'Field': 'Learning Goals', 'Value': plan.goals },
      { 'Field': 'Created At', 'Value': new Date(plan.createdAt).toLocaleDateString() }
    ];
    
    const detailWs = XLSX.utils.json_to_sheet(detailedPlanData);
    XLSX.utils.book_append_sheet(workbook, detailWs, `Plan ${index + 1} Detail`);
  });
  
  // Generate report title with filters
  let title = 'Teaching Plans Report';
  if (type) {
    title += ` - ${type}`;
  }
  if (className) {
    title += ` - ${className}`;
  }
  title += ` (Generated: ${new Date().toLocaleDateString()})`;
  
  // Add report info sheet
  const reportInfoData = [
    { 'Report': title },
    { 'Report': `Total Plans: ${plans.length}` },
    { 'Report': `Generated On: ${new Date().toLocaleString()}` },
    { 'Report': 'Nepal Central High School, Narephat, Kathmandu' }
  ];
  
  const reportInfoWs = XLSX.utils.json_to_sheet(reportInfoData);
  XLSX.utils.book_append_sheet(workbook, reportInfoWs, 'Report Info');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}
