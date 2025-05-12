import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Student, ProgressEntry, TeachingPlan } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Types for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Function to generate PDF student report
export async function generateStudentPDF(
  students: Student[], 
  progressEntries: { [studentId: number]: ProgressEntry[] },
  includePhotos: boolean = true
): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(100, 50, 200); // Purple color
  doc.text('Nepal Central High School', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Student Progress Report', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('Narephat, Kathmandu', doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
  
  // Add line
  doc.setDrawColor(100, 50, 200);
  doc.line(20, 50, doc.internal.pageSize.getWidth() - 20, 50);
  
  let yPos = 60;
  
  // For each student
  for (const student of students) {
    // Check if need new page
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    // Student details section
    doc.setFontSize(14);
    doc.setTextColor(100, 50, 200);
    doc.text(`Student: ${student.name}`, 20, yPos);
    yPos += 10;
    
    // Student photo if available and requested
    if (includePhotos && student.photoUrl) {
      try {
        // Only attempt to add image if we're in online mode
        if (navigator.onLine) {
          doc.addImage(student.photoUrl, 'JPEG', 150, yPos - 10, 30, 30);
        }
      } catch (error) {
        console.error('Error adding student photo to PDF:', error);
        // Continue without the image if there's an error
      }
    }
    
    // Student details in two columns
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Class: ${student.class}`, 20, yPos);
    doc.text(`Age: ${student.age} years`, 80, yPos);
    yPos += 7;
    
    doc.text(`Learning Ability: ${student.learningAbility}`, 20, yPos);
    doc.text(`Writing Speed: ${student.writingSpeed}`, 80, yPos);
    yPos += 10;
    
    // Progress entries table
    const studentProgress = progressEntries[student.id] || [];
    
    if (studentProgress.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(100, 50, 200);
      doc.text('Progress History', 20, yPos);
      yPos += 10;
      
      const tableColumn = [
        'Date', 
        'Social Skills', 
        'Pre-Literacy', 
        'Pre-Numeracy', 
        'Motor Skills', 
        'Emotional Dev.'
      ];
      
      const tableRows = studentProgress.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.socialSkills,
        entry.preLiteracy,
        entry.preNumeracy,
        entry.motorSkills,
        entry.emotionalDevelopment
      ]);
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 58, 237] }, // Purple color
        margin: { left: 20, right: 20 }
      });
      
      // Update yPos after the table
      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No progress entries available for this student.', 20, yPos);
      yPos += 15;
    }
    
    // Notes
    if (student.notes) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      
      // Word wrap for notes
      const splitNotes = doc.splitTextToSize(student.notes, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5 + 10;
    } else {
      yPos += 10;
    }
    
    // Add a separator line between students
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos);
    yPos += 15;
  }
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Nepal Central High School - Pre-Primary Management System',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc.output('blob');
}

// Function to generate Excel student report
export function generateStudentExcel(
  students: Student[], 
  progressEntries: { [studentId: number]: ProgressEntry[] }
): Blob {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(
    students.map(student => {
      // Get the most recent progress entry for this student
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
        'Social Skills': latestProgress?.socialSkills || 'N/A',
        'Pre-Literacy': latestProgress?.preLiteracy || 'N/A',
        'Pre-Numeracy': latestProgress?.preNumeracy || 'N/A',
        'Motor Skills': latestProgress?.motorSkills || 'N/A',
        'Emotional Development': latestProgress?.emotionalDevelopment || 'N/A',
        'Last Assessment Date': latestProgress ? new Date(latestProgress.date).toLocaleDateString() : 'N/A',
        'Notes': student.notes || ''
      };
    })
  );
  
  // Column widths
  const wscols = [
    { wch: 20 }, // Name
    { wch: 10 }, // Class
    { wch: 5 },  // Age
    { wch: 15 }, // Learning Ability
    { wch: 15 }, // Writing Speed
    { wch: 15 }, // Social Skills
    { wch: 15 }, // Pre-Literacy
    { wch: 15 }, // Pre-Numeracy
    { wch: 15 }, // Motor Skills
    { wch: 20 }, // Emotional Development
    { wch: 15 }, // Last Assessment Date
    { wch: 30 }  // Notes
  ];
  worksheet['!cols'] = wscols;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Progress');
  
  // Create blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Function to generate PDF teaching plan report
export function generateTeachingPlanPDF(plans: TeachingPlan[]): Blob {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(100, 50, 200); // Purple color
  doc.text('Nepal Central High School', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Teaching Plans Report', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('Narephat, Kathmandu', doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
  
  // Add line
  doc.setDrawColor(100, 50, 200);
  doc.line(20, 50, doc.internal.pageSize.getWidth() - 20, 50);
  
  let yPos = 60;
  
  // For each plan
  for (const plan of plans) {
    // Check if need new page
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    // Plan title
    doc.setFontSize(14);
    doc.setTextColor(100, 50, 200);
    doc.text(plan.title, 20, yPos);
    yPos += 10;
    
    // Plan details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Type: ${plan.type}`, 20, yPos);
    doc.text(`Class: ${plan.class}`, 80, yPos);
    yPos += 7;
    
    doc.text(`Start Date: ${new Date(plan.startDate).toLocaleDateString()}`, 20, yPos);
    doc.text(`End Date: ${new Date(plan.endDate).toLocaleDateString()}`, 80, yPos);
    yPos += 10;
    
    // Description
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Description:', 20, yPos);
    yPos += 5;
    
    const splitDesc = doc.splitTextToSize(plan.description, 170);
    doc.text(splitDesc, 20, yPos);
    yPos += splitDesc.length * 5 + 10;
    
    // Activities
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Activities:', 20, yPos);
    yPos += 5;
    
    const splitActivities = doc.splitTextToSize(plan.activities, 170);
    doc.text(splitActivities, 20, yPos);
    yPos += splitActivities.length * 5 + 10;
    
    // Goals
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Goals:', 20, yPos);
    yPos += 5;
    
    const splitGoals = doc.splitTextToSize(plan.goals, 170);
    doc.text(splitGoals, 20, yPos);
    yPos += splitGoals.length * 5 + 10;
    
    // Add a separator line between plans
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos);
    yPos += 15;
  }
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Nepal Central High School - Pre-Primary Management System',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc.output('blob');
}

// Function to generate Excel teaching plan report
export function generateTeachingPlanExcel(plans: TeachingPlan[]): Blob {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(
    plans.map(plan => ({
      'Title': plan.title,
      'Type': plan.type,
      'Class': plan.class,
      'Start Date': new Date(plan.startDate).toLocaleDateString(),
      'End Date': new Date(plan.endDate).toLocaleDateString(),
      'Description': plan.description,
      'Activities': plan.activities,
      'Goals': plan.goals,
      'Created Date': new Date(plan.createdAt).toLocaleDateString()
    }))
  );
  
  // Column widths
  const wscols = [
    { wch: 30 }, // Title
    { wch: 10 }, // Type
    { wch: 10 }, // Class
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 40 }, // Description
    { wch: 50 }, // Activities
    { wch: 40 }, // Goals
    { wch: 12 }  // Created Date
  ];
  worksheet['!cols'] = wscols;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Teaching Plans');
  
  // Create blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
