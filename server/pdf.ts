import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

/**
 * Generates a PDF report
 * @param type Type of report ('student-progress' or 'teaching-plan')
 * @param data Report data
 * @param includePhotos Whether to include student photos in the report
 * @returns PDF buffer
 */
export async function generatePdf(type: string, data: any, includePhotos: boolean = false): Promise<Buffer> {
  // Create new PDF document
  const doc = new jsPDF();

  // Add header
  addHeader(doc);

  // Add report content based on type
  if (type === 'student-progress') {
    await addStudentProgressReport(doc, data, includePhotos);
  } else if (type === 'teaching-plan') {
    addTeachingPlanReport(doc, data);
  }

  // Add footer
  addFooter(doc);

  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Adds header to the PDF
 */
function addHeader(doc: jsPDF): void {
  // Add school logo (mock)
  doc.setFillColor(123, 58, 237); // purple-600
  doc.rect(14, 10, 182, 20, 'F');
  
  // Add school name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Nepal Central High School', 105, 22, { align: 'center' });
  
  // Add report subtitle
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Pre-Primary Student Records', 105, 40, { align: 'center' });
  
  // Add date
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(10);
  doc.text(`Generated on: ${today}`, 105, 46, { align: 'center' });
  
  // Add some space
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 50, 196, 50);
}

/**
 * Adds student progress report content
 */
async function addStudentProgressReport(doc: jsPDF, data: any, includePhotos: boolean): Promise<void> {
  let yPosition = 60;
  
  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Progress Report', 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Process each student
  for (let i = 0; i < data.length; i++) {
    const { student, teacherName, progressEntries } = data[i];
    
    // Check if we need to add a new page
    if (yPosition > 250) {
      doc.addPage();
      addHeader(doc);
      yPosition = 60;
    }
    
    // Student header
    doc.setFillColor(237, 233, 254); // purple-100
    doc.rect(14, yPosition, 182, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student: ${student.name}`, 20, yPosition + 7);
    yPosition += 15;
    
    // Student details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Try to add student photo if requested
    let photoWidth = 0;
    if (includePhotos && student.photoUrl) {
      try {
        // Fetch the image
        const response = await axios.get(student.photoUrl, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(response.data).toString('base64');
        
        // Add image to PDF
        doc.addImage(`data:image/jpeg;base64,${imageData}`, 'JPEG', 20, yPosition, 30, 30);
        photoWidth = 40; // image width + margin
      } catch (error) {
        console.error('Error adding student photo to PDF:', error);
      }
    }
    
    // Student info in columns
    const col1X = 20 + photoWidth;
    const col2X = 105;
    
    doc.text(`Class: ${student.class}`, col1X, yPosition + 5);
    doc.text(`Age: ${student.age} years`, col2X, yPosition + 5);
    
    doc.text(`Learning Ability: ${student.learningAbility}`, col1X, yPosition + 12);
    doc.text(`Writing Speed: ${student.writingSpeed || 'N/A'}`, col2X, yPosition + 12);
    
    doc.text(`Teacher: ${teacherName}`, col1X, yPosition + 19);
    doc.text(`Parent Contact: ${student.parentContact || 'N/A'}`, col2X, yPosition + 19);
    
    yPosition += photoWidth > 0 ? Math.max(40, photoWidth) : 25;
    
    // Progress entries
    if (progressEntries && progressEntries.length > 0) {
      // Add table of progress entries
      const tableColumn = [
        "Date", 
        "Social Skills", 
        "Pre-Literacy", 
        "Pre-Numeracy",
        "Motor Skills",
        "Emotional Dev."
      ];
      
      const tableRows = progressEntries.map(entry => [
        new Date(entry.date).toLocaleDateString('en-US'),
        entry.socialSkills,
        entry.preLiteracy,
        entry.preNumeracy,
        entry.motorSkills,
        entry.emotionalDevelopment
      ]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [tableColumn],
        body: tableRows,
        headStyles: { fillColor: [123, 58, 237], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.text('No progress entries recorded.', 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 15;
  }
}

/**
 * Adds teaching plan report content
 */
function addTeachingPlanReport(doc: jsPDF, data: any): void {
  let yPosition = 60;
  
  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Teaching Plans Report', 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Process each plan
  for (let i = 0; i < data.length; i++) {
    const { plan, teacherName } = data[i];
    
    // Check if we need to add a new page
    if (yPosition > 240) {
      doc.addPage();
      addHeader(doc);
      yPosition = 60;
    }
    
    // Plan header
    doc.setFillColor(237, 233, 254); // purple-100
    doc.rect(14, yPosition, 182, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${plan.type} Plan: ${plan.title}`, 20, yPosition + 7);
    yPosition += 15;
    
    // Plan details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Class: ${plan.class}`, 20, yPosition);
    doc.text(`Duration: ${new Date(plan.startDate).toLocaleDateString('en-US')} to ${new Date(plan.endDate).toLocaleDateString('en-US')}`, 105, yPosition);
    yPosition += 7;
    
    doc.text(`Created by: ${teacherName}`, 20, yPosition);
    yPosition += 10;
    
    // Plan description
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    // Handle text wrapping for description
    const splitDescription = doc.splitTextToSize(plan.description, 170);
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 5;
    
    // Plan activities
    doc.setFont('helvetica', 'bold');
    doc.text('Activities:', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    // Handle text wrapping for activities
    const splitActivities = doc.splitTextToSize(plan.activities, 170);
    doc.text(splitActivities, 20, yPosition);
    yPosition += splitActivities.length * 5 + 5;
    
    // Plan goals
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Goals:', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    // Handle text wrapping for goals
    const splitGoals = doc.splitTextToSize(plan.goals, 170);
    doc.text(splitGoals, 20, yPosition);
    yPosition += splitGoals.length * 5 + 15;
  }
}

/**
 * Adds footer to the PDF
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    
    // Add school address and contact at the bottom
    if (i === pageCount) {
      doc.setFontSize(8);
      doc.text('Nepal Central High School, Narephat, Kathmandu', 105, 290, { align: 'center' });
    }
  }
}
