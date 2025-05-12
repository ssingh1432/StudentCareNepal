/**
 * Helper functions for generating PDF and Excel reports
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Student, Progress, TeachingPlan } from '@shared/schema';
import { formatCloudinaryUrl } from './cloudinary';

// Generate PDF student progress report
export const generateStudentProgressPDF = async (
  students: Student[],
  progressEntries: Record<number, Progress[]>,
  includePhotos: boolean = false
): Promise<Blob> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(124, 58, 237); // purple-600
  doc.text('Nepal Central High School', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Student Progress Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Narephat, Kathmandu', doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' });
  
  // Add date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Report Date: ${currentDate}`, doc.internal.pageSize.getWidth() - 15, 40, { align: 'right' });
  
  // Add students with their progress
  let yPosition = 50;
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const studentProgress = progressEntries[student.id] || [];
    
    // Add page break if needed
    if (yPosition > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Add student info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`${student.name}`, 15, yPosition);
    
    // Add student photo if available and requested
    if (includePhotos && student.photoUrl) {
      try {
        const optimizedUrl = formatCloudinaryUrl(student.photoUrl, { width: 80, height: 80 });
        const imgData = await fetch(optimizedUrl).then(r => r.arrayBuffer());
        doc.addImage(imgData, 'JPEG', 150, yPosition - 10, 30, 30);
      } catch (error) {
        console.error('Error adding student photo to PDF:', error);
      }
    }
    
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Class: ${student.class}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Age: ${student.age} years`, 15, yPosition);
    yPosition += 5;
    doc.text(`Learning Ability: ${student.learningAbility}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Writing Speed: ${student.writingSpeed}`, 15, yPosition);
    yPosition += 10;
    
    // Add progress table if there are entries
    if (studentProgress.length > 0) {
      // Define table columns
      const headers = [
        'Date', 
        'Social Skills', 
        'Pre-Literacy', 
        'Pre-Numeracy', 
        'Motor Skills', 
        'Emotional Dev.'
      ];
      
      // Prepare data rows
      const data = studentProgress.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.socialSkills,
        entry.preLiteracy,
        entry.preNumeracy,
        entry.motorSkills,
        entry.emotionalDev
      ]);
      
      // @ts-ignore - jspdf-autotable is not properly typed
      doc.autoTable({
        startY: yPosition,
        head: [headers],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 }
      });
      
      // @ts-ignore - jspdf-autotable adds this property
      yPosition = doc.lastAutoTable.finalY + 15;
    } else {
      doc.text('No progress entries available.', 15, yPosition);
      yPosition += 15;
    }
    
    // Add separator for next student
    if (i < students.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPosition - 5, doc.internal.pageSize.getWidth() - 15, yPosition - 5);
      yPosition += 10;
    }
  }
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Nepal Central High School - Pre-Primary Student Record-Keeping System', 
      doc.internal.pageSize.getWidth() / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: 'center' }
    );
  }
  
  return doc.output('blob');
};

// Generate Excel student progress report
export const generateStudentProgressExcel = (
  students: Student[],
  progressEntries: Record<number, Progress[]>
): Blob => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet for student info
  const studentData = students.map(student => {
    const latestProgress = progressEntries[student.id]?.[0] || null;
    
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
      'Emotional Development': latestProgress?.emotionalDev || 'N/A',
      'Latest Progress Date': latestProgress ? new Date(latestProgress.date).toLocaleDateString() : 'N/A'
    };
  });
  
  const wsStudents = XLSX.utils.json_to_sheet(studentData);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
  
  // Create worksheet for progress history
  const progressData: any[] = [];
  
  students.forEach(student => {
    const entries = progressEntries[student.id] || [];
    
    entries.forEach(entry => {
      progressData.push({
        'Student Name': student.name,
        'Class': student.class,
        'Date': new Date(entry.date).toLocaleDateString(),
        'Social Skills': entry.socialSkills,
        'Pre-Literacy': entry.preLiteracy,
        'Pre-Numeracy': entry.preNumeracy,
        'Motor Skills': entry.motorSkills,
        'Emotional Development': entry.emotionalDev,
        'Comments': entry.comments || ''
      });
    });
  });
  
  if (progressData.length > 0) {
    const wsProgress = XLSX.utils.json_to_sheet(progressData);
    XLSX.utils.book_append_sheet(wb, wsProgress, 'Progress History');
  }
  
  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buf], { type: 'application/octet-stream' });
};

// Generate PDF teaching plans report
export const generateTeachingPlansPDF = async (
  plans: TeachingPlan[],
  teacherNames: Record<number, string>
): Promise<Blob> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(124, 58, 237); // purple-600
  doc.text('Nepal Central High School', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Teaching Plans Report', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Narephat, Kathmandu', doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' });
  
  // Add date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Report Date: ${currentDate}`, doc.internal.pageSize.getWidth() - 15, 40, { align: 'right' });
  
  // Group plans by type
  const plansByType: Record<string, TeachingPlan[]> = {};
  
  plans.forEach(plan => {
    if (!plansByType[plan.type]) {
      plansByType[plan.type] = [];
    }
    plansByType[plan.type].push(plan);
  });
  
  let yPosition = 50;
  
  // Add plans by type
  Object.entries(plansByType).forEach(([type, typePlans]) => {
    // Add page break if needed
    if (yPosition > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Add plan type header
    doc.setFontSize(14);
    doc.setTextColor(124, 58, 237);
    doc.text(`${type} Plans`, 15, yPosition);
    yPosition += 10;
    
    // Add each plan
    typePlans.forEach((plan, index) => {
      // Add page break if needed
      if (yPosition > doc.internal.pageSize.getHeight() - 90) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add plan details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${plan.title}`, 15, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Class: ${plan.class}`, 15, yPosition);
      yPosition += 5;
      
      const startDate = new Date(plan.startDate).toLocaleDateString();
      const endDate = new Date(plan.endDate).toLocaleDateString();
      doc.text(`Period: ${startDate} to ${endDate}`, 15, yPosition);
      yPosition += 5;
      
      const teacherName = teacherNames[plan.createdBy] || 'Unknown';
      doc.text(`Created By: ${teacherName}`, 15, yPosition);
      yPosition += 7;
      
      // Description
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Description:', 15, yPosition);
      yPosition += 5;
      
      // Split description into lines to avoid overflow
      const descriptionLines = doc.splitTextToSize(plan.description, 180);
      doc.setTextColor(80, 80, 80);
      doc.text(descriptionLines, 15, yPosition);
      yPosition += descriptionLines.length * 5 + 5;
      
      // Activities
      doc.setTextColor(0, 0, 0);
      doc.text('Activities:', 15, yPosition);
      yPosition += 5;
      
      const activitiesLines = doc.splitTextToSize(plan.activities, 180);
      doc.setTextColor(80, 80, 80);
      doc.text(activitiesLines, 15, yPosition);
      yPosition += activitiesLines.length * 5 + 5;
      
      // Goals
      doc.setTextColor(0, 0, 0);
      doc.text('Learning Goals:', 15, yPosition);
      yPosition += 5;
      
      const goalsLines = doc.splitTextToSize(plan.goals, 180);
      doc.setTextColor(80, 80, 80);
      doc.text(goalsLines, 15, yPosition);
      yPosition += goalsLines.length * 5 + 10;
      
      // Add separator between plans
      if (index < typePlans.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition - 5, doc.internal.pageSize.getWidth() - 15, yPosition - 5);
        yPosition += 5;
      }
    });
    
    // Add space after each plan type
    yPosition += 10;
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Nepal Central High School - Pre-Primary Student Record-Keeping System', 
      doc.internal.pageSize.getWidth() / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: 'center' }
    );
  }
  
  return doc.output('blob');
};

// Generate Excel teaching plans report
export const generateTeachingPlansExcel = (
  plans: TeachingPlan[],
  teacherNames: Record<number, string>
): Blob => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet for plans
  const planData = plans.map(plan => {
    return {
      'Title': plan.title,
      'Type': plan.type,
      'Class': plan.class,
      'Start Date': new Date(plan.startDate).toLocaleDateString(),
      'End Date': new Date(plan.endDate).toLocaleDateString(),
      'Created By': teacherNames[plan.createdBy] || 'Unknown',
      'Description': plan.description,
      'Activities': plan.activities,
      'Learning Goals': plan.goals
    };
  });
  
  const wsPlans = XLSX.utils.json_to_sheet(planData);
  
  // Adjust column widths
  const columnWidths = [
    { wch: 30 }, // Title
    { wch: 10 }, // Type
    { wch: 10 }, // Class
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 20 }, // Created By
    { wch: 40 }, // Description
    { wch: 50 }, // Activities
    { wch: 40 }  // Learning Goals
  ];
  
  wsPlans['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(wb, wsPlans, 'Teaching Plans');
  
  // Group plans by class
  const plansByClass: Record<string, TeachingPlan[]> = {
    'Nursery': plans.filter(p => p.class === 'Nursery'),
    'LKG': plans.filter(p => p.class === 'LKG'),
    'UKG': plans.filter(p => p.class === 'UKG')
  };
  
  // Create a summary worksheet
  const summaryData = Object.entries(plansByClass).map(([className, classPlans]) => {
    return {
      'Class': className,
      'Total Plans': classPlans.length,
      'Annual Plans': classPlans.filter(p => p.type === 'Annual').length,
      'Monthly Plans': classPlans.filter(p => p.type === 'Monthly').length,
      'Weekly Plans': classPlans.filter(p => p.type === 'Weekly').length
    };
  });
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  
  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buf], { type: 'application/octet-stream' });
};
