import * as xlsx from 'xlsx';
import { Student, ProgressEntry, TeachingPlan } from '@shared/schema';
import { IStorage } from './storage';

interface ReportOptions {
  startDate?: string;
  endDate?: string;
  templateType?: 'studentProgress' | 'teachingPlans';
  storage?: IStorage;
}

/**
 * Generate an Excel report for students or teaching plans
 */
export async function generateExcelReport(
  data: Student[] | TeachingPlan[],
  options: ReportOptions
): Promise<Buffer> {
  const templateType = options.templateType || 'studentProgress';
  let workbook: xlsx.WorkBook;
  
  if (templateType === 'studentProgress') {
    workbook = await generateStudentProgressExcel(data as Student[], options);
  } else {
    workbook = generateTeachingPlansExcel(data as TeachingPlan[]);
  }
  
  // Write to buffer
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Generate student progress Excel report
 */
async function generateStudentProgressExcel(
  students: Student[],
  options: ReportOptions
): Promise<xlsx.WorkBook> {
  const workbook = xlsx.utils.book_new();
  
  // Create overview sheet
  const overviewData: any[] = [];
  
  // Add headers
  overviewData.push([
    'Nepal Central High School - Student Progress Report',
    '', '', '', '', ''
  ]);
  
  if (options.startDate && options.endDate) {
    overviewData.push([
      `Period: ${options.startDate} to ${options.endDate}`,
      '', '', '', '', ''
    ]);
  }
  
  overviewData.push(['', '', '', '', '', '']);
  
  // Add column headers
  overviewData.push([
    'Name',
    'Age',
    'Class',
    'Learning Ability',
    'Writing Speed',
    'Latest Progress'
  ]);
  
  // Add student data
  for (const student of students) {
    let latestProgress = 'No data';
    
    if (options.storage) {
      const progressEntries = await options.storage.getProgressEntriesByStudentId(student.id);
      if (progressEntries.length > 0) {
        const latest = progressEntries[0]; // Assuming sorted by date desc
        latestProgress = `Social: ${formatEnumValue(latest.socialSkills)}, `
          + `Literacy: ${formatEnumValue(latest.preLiteracy)}, `
          + `Numeracy: ${formatEnumValue(latest.preNumeracy)}`;
      }
    }
    
    overviewData.push([
      student.name,
      student.age,
      student.classType.toUpperCase(),
      formatEnumValue(student.learningAbility),
      formatEnumValue(student.writingSpeed),
      latestProgress
    ]);
  }
  
  // Create worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(overviewData);
  
  // Set column widths
  const colWidths = [
    { wch: 25 }, // Name
    { wch: 6 },  // Age
    { wch: 8 },  // Class
    { wch: 15 }, // Learning Ability
    { wch: 15 }, // Writing Speed
    { wch: 60 }  // Latest Progress
  ];
  
  worksheet['!cols'] = colWidths;
  
  // Style header row
  for (let i = 0; i < 6; i++) {
    const cellRef = xlsx.utils.encode_cell({ r: 3, c: i });
    worksheet[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EDE9FE" } } // Light purple background
    };
  }
  
  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Student Overview');
  
  // Create individual class sheets
  const classTypes = ['nursery', 'lkg', 'ukg'];
  
  for (const classType of classTypes) {
    const classStudents = students.filter(s => s.classType === classType);
    
    if (classStudents.length > 0) {
      const classSheetData: any[] = [];
      
      // Add header
      classSheetData.push([
        `${classType.toUpperCase()} Class - Student Progress Report`,
        '', '', '', '', ''
      ]);
      
      classSheetData.push(['', '', '', '', '', '']);
      
      // Add column headers
      classSheetData.push([
        'Name',
        'Age',
        'Learning Ability',
        'Writing Speed',
        'Social Skills',
        'Pre-Literacy',
        'Pre-Numeracy',
        'Motor Skills',
        'Emotional Dev.'
      ]);
      
      // Add student data
      for (const student of classStudents) {
        let socialSkills = '';
        let preLiteracy = '';
        let preNumeracy = '';
        let motorSkills = '';
        let emotionalDev = '';
        
        if (options.storage) {
          const progressEntries = await options.storage.getProgressEntriesByStudentId(student.id);
          if (progressEntries.length > 0) {
            const latest = progressEntries[0]; // Assuming sorted by date desc
            socialSkills = formatEnumValue(latest.socialSkills);
            preLiteracy = formatEnumValue(latest.preLiteracy);
            preNumeracy = formatEnumValue(latest.preNumeracy);
            motorSkills = formatEnumValue(latest.motorSkills);
            emotionalDev = formatEnumValue(latest.emotionalDevelopment);
          }
        }
        
        classSheetData.push([
          student.name,
          student.age,
          formatEnumValue(student.learningAbility),
          formatEnumValue(student.writingSpeed),
          socialSkills,
          preLiteracy,
          preNumeracy,
          motorSkills,
          emotionalDev
        ]);
      }
      
      // Create worksheet
      const classWorksheet = xlsx.utils.aoa_to_sheet(classSheetData);
      
      // Style header row
      for (let i = 0; i < 9; i++) {
        const cellRef = xlsx.utils.encode_cell({ r: 2, c: i });
        classWorksheet[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EDE9FE" } } // Light purple background
        };
      }
      
      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, classWorksheet, classType.toUpperCase());
    }
  }
  
  return workbook;
}

/**
 * Generate teaching plans Excel report
 */
function generateTeachingPlansExcel(plans: TeachingPlan[]): xlsx.WorkBook {
  const workbook = xlsx.utils.book_new();
  
  // Create overview sheet
  const overviewData: any[] = [];
  
  // Add header
  overviewData.push([
    'Nepal Central High School - Teaching Plans Report',
    '', '', '', '', ''
  ]);
  
  overviewData.push(['', '', '', '', '', '']);
  
  // Add column headers
  overviewData.push([
    'Title',
    'Type',
    'Class',
    'Start Date',
    'End Date',
    'Description'
  ]);
  
  // Add plan data
  for (const plan of plans) {
    overviewData.push([
      plan.title,
      formatEnumValue(plan.type),
      plan.classType.toUpperCase(),
      new Date(plan.startDate).toLocaleDateString(),
      new Date(plan.endDate).toLocaleDateString(),
      plan.description
    ]);
  }
  
  // Create worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(overviewData);
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // Title
    { wch: 10 }, // Type
    { wch: 8 },  // Class
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 50 }  // Description
  ];
  
  worksheet['!cols'] = colWidths;
  
  // Style header row
  for (let i = 0; i < 6; i++) {
    const cellRef = xlsx.utils.encode_cell({ r: 2, c: i });
    worksheet[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EDE9FE" } } // Light purple background
    };
  }
  
  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Plans Overview');
  
  // Create detail sheet with activities and goals
  const detailData: any[] = [];
  
  // Add header
  detailData.push([
    'Nepal Central High School - Teaching Plan Details',
    '', '', ''
  ]);
  
  detailData.push(['', '', '', '']);
  
  // Add column headers
  detailData.push([
    'Title',
    'Class',
    'Activities',
    'Goals'
  ]);
  
  // Add plan details
  for (const plan of plans) {
    detailData.push([
      plan.title,
      plan.classType.toUpperCase(),
      plan.activities,
      plan.goals
    ]);
  }
  
  // Create worksheet
  const detailWorksheet = xlsx.utils.aoa_to_sheet(detailData);
  
  // Set column widths
  const detailColWidths = [
    { wch: 30 }, // Title
    { wch: 8 },  // Class
    { wch: 60 }, // Activities
    { wch: 60 }  // Goals
  ];
  
  detailWorksheet['!cols'] = detailColWidths;
  
  // Style header row
  for (let i = 0; i < 4; i++) {
    const cellRef = xlsx.utils.encode_cell({ r: 2, c: i });
    detailWorksheet[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EDE9FE" } } // Light purple background
    };
  }
  
  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, detailWorksheet, 'Plan Details');
  
  // Create sheets by class type
  const classTypes = ['nursery', 'lkg', 'ukg'];
  
  for (const classType of classTypes) {
    const classPlans = plans.filter(p => p.classType === classType);
    
    if (classPlans.length > 0) {
      const classSheetData: any[] = [];
      
      // Add header
      classSheetData.push([
        `${classType.toUpperCase()} Class - Teaching Plans`,
        '', '', '', ''
      ]);
      
      classSheetData.push(['', '', '', '', '']);
      
      // Add column headers
      classSheetData.push([
        'Title',
        'Type',
        'Period',
        'Activities',
        'Goals'
      ]);
      
      // Add plan data
      for (const plan of classPlans) {
        classSheetData.push([
          plan.title,
          formatEnumValue(plan.type),
          `${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`,
          plan.activities,
          plan.goals
        ]);
      }
      
      // Create worksheet
      const classWorksheet = xlsx.utils.aoa_to_sheet(classSheetData);
      
      // Style header row
      for (let i = 0; i < 5; i++) {
        const cellRef = xlsx.utils.encode_cell({ r: 2, c: i });
        classWorksheet[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EDE9FE" } } // Light purple background
        };
      }
      
      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, classWorksheet, `${classType.toUpperCase()} Plans`);
    }
  }
  
  return workbook;
}

/**
 * Format enum values for display
 */
function formatEnumValue(value: string): string {
  if (!value) return 'N/A';
  
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
