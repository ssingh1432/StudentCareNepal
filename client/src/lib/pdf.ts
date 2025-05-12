import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from './utils';

// Extend the jsPDF typing to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Base function for PDF generation
const createPDF = (title: string, includeHeader: boolean = true): jsPDF => {
  const pdf = new jsPDF();
  
  if (includeHeader) {
    // Add school header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(124, 58, 237); // Purple color (#7C3AED)
    pdf.text('Nepal Central High School', pdf.internal.pageSize.width / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(107, 114, 128); // Gray color
    pdf.text('Narephat, Kathmandu', pdf.internal.pageSize.width / 2, 28, { align: 'center' });
    
    // Add report title
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55); // Dark gray color
    pdf.text(title, pdf.internal.pageSize.width / 2, 40, { align: 'center' });
    
    // Add horizontal line
    pdf.setDrawColor(229, 231, 235); // Light gray color
    pdf.line(20, 45, pdf.internal.pageSize.width - 20, 45);
  }
  
  return pdf;
};

// Function to generate student progress report
export const generateStudentProgressReport = (
  students: any[],
  includePhotos: boolean = false,
  dateRange?: { from: string, to: string }
): jsPDF => {
  const title = 'Student Progress Report';
  const pdf = createPDF(title);
  
  // Add date range if provided
  if (dateRange) {
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(
      `Date Range: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`,
      pdf.internal.pageSize.width / 2,
      55,
      { align: 'center' }
    );
  }
  
  // Define the columns for the table
  const columns = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Class', dataKey: 'class' },
    { header: 'Age', dataKey: 'age' },
    { header: 'Learning Ability', dataKey: 'learningAbility' },
    { header: 'Writing Speed', dataKey: 'writingSpeed' },
  ];
  
  // Format student data for the table
  const data = students.map(student => ({
    name: student.name,
    class: student.class,
    age: `${student.age} years`,
    learningAbility: student.learningAbility,
    writingSpeed: student.writingSpeed === 'N/A' ? 'Not Applicable' : student.writingSpeed,
  }));
  
  // Add the table to the PDF
  pdf.autoTable({
    startY: 65,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Add student photos if required
  if (includePhotos && students.some(s => s.photoUrl)) {
    const photosStartY = (pdf as any).lastAutoTable.finalY + 20;
    pdf.text('Student Photos', 20, photosStartY);
    
    let photoX = 20;
    let photoY = photosStartY + 10;
    const photoWidth = 30;
    const photoHeight = 30;
    const photosPerRow = 5;
    
    students.forEach((student, index) => {
      if (student.photoUrl) {
        try {
          pdf.addImage(
            student.photoUrl,
            'JPEG',
            photoX,
            photoY,
            photoWidth,
            photoHeight
          );
          
          // Add student name below photo
          pdf.setFontSize(8);
          pdf.text(
            student.name,
            photoX + photoWidth / 2,
            photoY + photoHeight + 5,
            { align: 'center' }
          );
          
          // Move to the next position
          photoX += photoWidth + 15;
          if ((index + 1) % photosPerRow === 0) {
            photoX = 20;
            photoY += photoHeight + 15;
          }
        } catch (e) {
          console.error('Error adding image to PDF:', e);
        }
      }
    });
  }
  
  // Add footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on: ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.width - 20,
      pdf.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return pdf;
};

// Function to generate progress entries report for a student
export const generateStudentProgressEntriesReport = (
  student: any,
  progressEntries: any[]
): jsPDF => {
  const title = `Progress Report for ${student.name}`;
  const pdf = createPDF(title);
  
  // Add student details
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.text(`Name: ${student.name}`, 20, 55);
  pdf.text(`Class: ${student.class}`, 20, 63);
  pdf.text(`Age: ${student.age} years`, 20, 71);
  pdf.text(`Learning Ability: ${student.learningAbility}`, 20, 79);
  pdf.text(`Writing Speed: ${student.writingSpeed === 'N/A' ? 'Not Applicable' : student.writingSpeed}`, 20, 87);
  
  // Add student photo if available
  if (student.photoUrl) {
    try {
      pdf.addImage(
        student.photoUrl,
        'JPEG',
        pdf.internal.pageSize.width - 60,
        55,
        40,
        40
      );
    } catch (e) {
      console.error('Error adding image to PDF:', e);
    }
  }
  
  // Define columns for progress entries table
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Social Skills', dataKey: 'socialSkills' },
    { header: 'Pre-Literacy', dataKey: 'preLiteracy' },
    { header: 'Pre-Numeracy', dataKey: 'preNumeracy' },
    { header: 'Motor Skills', dataKey: 'motorSkills' },
    { header: 'Emotional Dev.', dataKey: 'emotionalDevelopment' },
  ];
  
  // Format progress entries for the table
  const data = progressEntries.map(entry => ({
    date: formatDate(entry.date),
    socialSkills: entry.socialSkills,
    preLiteracy: entry.preLiteracy,
    preNumeracy: entry.preNumeracy,
    motorSkills: entry.motorSkills,
    emotionalDevelopment: entry.emotionalDevelopment,
  }));
  
  // Add the table to the PDF
  pdf.autoTable({
    startY: 100,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Add comments if available
  const commentsStartY = (pdf as any).lastAutoTable.finalY + 15;
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Comments:', 20, commentsStartY);
  
  let commentY = commentsStartY + 8;
  progressEntries.forEach((entry, index) => {
    if (entry.comments) {
      pdf.setFontSize(10);
      pdf.text(`${formatDate(entry.date)}: ${entry.comments}`, 25, commentY);
      commentY += 8;
    }
  });
  
  // Add footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on: ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.width - 20,
      pdf.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return pdf;
};

// Function to generate teaching plans report
export const generateTeachingPlansReport = (
  plans: any[],
  className?: string,
  type?: string
): jsPDF => {
  const title = `Teaching Plans Report${className ? ` - ${className}` : ''}${type ? ` (${type})` : ''}`;
  const pdf = createPDF(title);
  
  // Define columns for teaching plans table
  const columns = [
    { header: 'Title', dataKey: 'title' },
    { header: 'Class', dataKey: 'class' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Date Range', dataKey: 'dateRange' },
  ];
  
  // Format teaching plans for the table
  const data = plans.map(plan => ({
    title: plan.title,
    class: plan.class,
    type: plan.type,
    dateRange: `${formatDate(plan.startDate)} to ${formatDate(plan.endDate)}`,
  }));
  
  // Add the table to the PDF
  pdf.autoTable({
    startY: 55,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Add detailed plan information
  const detailsStartY = (pdf as any).lastAutoTable.finalY + 15;
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Detailed Plans:', 20, detailsStartY);
  
  let detailY = detailsStartY + 10;
  plans.forEach((plan, index) => {
    // Check if we need to add a new page
    if (detailY > pdf.internal.pageSize.height - 40) {
      pdf.addPage();
      detailY = 20;
    }
    
    // Add plan details
    pdf.setFontSize(12);
    pdf.setTextColor(124, 58, 237);
    pdf.text(`${index + 1}. ${plan.title}`, 20, detailY);
    
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`${plan.class} - ${plan.type}`, 25, detailY + 7);
    pdf.text(`${formatDate(plan.startDate)} to ${formatDate(plan.endDate)}`, 25, detailY + 14);
    
    pdf.setTextColor(31, 41, 55);
    pdf.text('Description:', 25, detailY + 24);
    const descriptionLines = pdf.splitTextToSize(plan.description, pdf.internal.pageSize.width - 55);
    pdf.text(descriptionLines, 35, detailY + 31);
    
    const descHeight = descriptionLines.length * 5;
    
    pdf.text('Activities:', 25, detailY + 31 + descHeight + 5);
    const activitiesLines = pdf.splitTextToSize(plan.activities, pdf.internal.pageSize.width - 55);
    pdf.text(activitiesLines, 35, detailY + 31 + descHeight + 12);
    
    const activitiesHeight = activitiesLines.length * 5;
    
    pdf.text('Goals:', 25, detailY + 31 + descHeight + 12 + activitiesHeight + 5);
    const goalsLines = pdf.splitTextToSize(plan.goals, pdf.internal.pageSize.width - 55);
    pdf.text(goalsLines, 35, detailY + 31 + descHeight + 12 + activitiesHeight + 12);
    
    const goalsHeight = goalsLines.length * 5;
    
    // Update Y position for the next plan
    detailY += 31 + descHeight + 12 + activitiesHeight + 12 + goalsHeight + 20;
    
    // Add a separator line if not the last plan
    if (index < plans.length - 1) {
      pdf.setDrawColor(229, 231, 235);
      pdf.line(20, detailY - 10, pdf.internal.pageSize.width - 20, detailY - 10);
    }
  });
  
  // Add footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on: ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.width - 20,
      pdf.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return pdf;
};

export default {
  generateStudentProgressReport,
  generateStudentProgressEntriesReport,
  generateTeachingPlansReport
};
