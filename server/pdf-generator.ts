import PDFDocument from 'pdfkit';
import { Student, Progress, TeachingPlan } from '@shared/schema';
import axios from 'axios';
import { createWriteStream } from 'fs';

// Function to generate a student progress report PDF
export async function generateStudentProgressPDF(
  students: Student[],
  progressRecords: Map<number, Progress[]>,
  includePhotos: boolean = false,
  className?: string
): Promise<PDFDocument> {
  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Add header
  doc.fontSize(18).font('Helvetica-Bold').text('Nepal Central High School', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text('Student Progress Report', { align: 'center' });
  doc.fontSize(10).text('Narephat, Kathmandu', { align: 'center' });
  doc.moveDown(1);

  // Add report date
  const reportDate = new Date().toLocaleDateString();
  doc.fontSize(10).text(`Report Generated: ${reportDate}`, { align: 'right' });
  doc.moveDown(1);

  // Add filters if any
  if (className) {
    doc.fontSize(12).font('Helvetica-Bold').text(`Class: ${className}`);
    doc.moveDown(0.5);
  }

  // Loop through each student
  for (const student of students) {
    const studentProgress = progressRecords.get(student.id) || [];
    
    doc.moveDown(1);
    
    // Start student section with a line separator
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown(0.5);

    // Create a row for student info with photo if requested
    if (includePhotos && student.photoUrl) {
      try {
        // Add student information in a table-like format
        doc.fontSize(14).font('Helvetica-Bold').text(student.name, { continued: true });
        
        // Leave space for image
        const initialY = doc.y;
        doc.moveDown(0.5);
        
        // Add student details
        doc.fontSize(10).font('Helvetica')
           .text(`Class: ${student.class}`, { continued: false });
        doc.text(`Age: ${student.age} years`, { continued: false });
        doc.text(`Learning Ability: ${student.learningAbility}`, { continued: false });
        
        if (student.writingSpeed && student.class !== 'Nursery') {
          doc.text(`Writing Speed: ${student.writingSpeed}`, { continued: false });
        }
        
        // Try to download and embed the student photo
        try {
          const response = await axios.get(student.photoUrl, { responseType: 'arraybuffer' });
          
          // Calculate position for image (to the right of the text)
          const imageX = 450;
          
          // Add the image to the PDF
          doc.image(response.data, imageX, initialY, { 
            fit: [80, 80],
            align: 'right',
            valign: 'top'
          });
        } catch (error) {
          console.error(`Failed to load photo for student ${student.id}:`, error);
        }
      } catch (error) {
        console.error('Error adding student photo:', error);
        
        // Fallback to text-only if photo fails
        doc.fontSize(14).font('Helvetica-Bold').text(student.name);
        doc.fontSize(10).font('Helvetica')
           .text(`Class: ${student.class}`)
           .text(`Age: ${student.age} years`)
           .text(`Learning Ability: ${student.learningAbility}`);
        
        if (student.writingSpeed && student.class !== 'Nursery') {
          doc.text(`Writing Speed: ${student.writingSpeed}`);
        }
      }
    } else {
      // Text-only student information
      doc.fontSize(14).font('Helvetica-Bold').text(student.name);
      doc.fontSize(10).font('Helvetica')
         .text(`Class: ${student.class}`)
         .text(`Age: ${student.age} years`)
         .text(`Learning Ability: ${student.learningAbility}`);
      
      if (student.writingSpeed && student.class !== 'Nursery') {
        doc.text(`Writing Speed: ${student.writingSpeed}`);
      }
    }
    
    doc.moveDown(1);
    
    // Progress history
    if (studentProgress.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Progress History:');
      doc.moveDown(0.5);
      
      // Create headers for the table
      doc.fontSize(9).font('Helvetica-Bold');
      
      const columns = {
        date: { x: 50, width: 80 },
        social: { x: 130, width: 70 },
        literacy: { x: 200, width: 70 },
        numeracy: { x: 270, width: 70 },
        motor: { x: 340, width: 70 },
        emotional: { x: 410, width: 90 }
      };
      
      // Draw headers
      doc.text('Date', columns.date.x, doc.y);
      doc.text('Social Skills', columns.social.x, doc.y);
      doc.text('Pre-Literacy', columns.literacy.x, doc.y);
      doc.text('Pre-Numeracy', columns.numeracy.x, doc.y);
      doc.text('Motor Skills', columns.motor.x, doc.y);
      doc.text('Emotional Dev.', columns.emotional.x, doc.y);
      
      doc.moveDown(0.5);
      
      // Draw a line under the headers
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown(0.5);
      
      // List progress entries
      studentProgress
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(entry => {
          // Format date
          const entryDate = new Date(entry.date).toLocaleDateString();
          
          // Regular font for data rows
          doc.fontSize(9).font('Helvetica');
          
          // Draw each cell
          doc.text(entryDate, columns.date.x, doc.y);
          doc.text(entry.socialSkills, columns.social.x, doc.y);
          doc.text(entry.preLiteracy, columns.literacy.x, doc.y);
          doc.text(entry.preNumeracy, columns.numeracy.x, doc.y);
          doc.text(entry.motorSkills, columns.motor.x, doc.y);
          doc.text(entry.emotionalDevelopment, columns.emotional.x, doc.y);
          
          doc.moveDown(0.5);
          
          // Add comments if present
          if (entry.comments) {
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(`Comments: ${entry.comments}`, { indent: 10 });
            doc.moveDown(0.5);
          }
        });
    } else {
      doc.fontSize(10).font('Helvetica-Italic').text('No progress records available.');
    }
    
    // Add a page break after each student except the last one
    if (student !== students[students.length - 1]) {
      doc.addPage();
    }
  }
  
  // Add footer with page numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc.moveTo(50, doc.page.height - 50)
       .lineTo(550, doc.page.height - 50)
       .stroke();
       
    // Page number and system info
    doc.fontSize(8).font('Helvetica')
       .text(
         `Page ${i + 1} of ${totalPages} | Nepal Central High School Pre-Primary System`,
         50,
         doc.page.height - 40,
         { align: 'center' }
       );
  }
  
  // Finalize PDF
  doc.end();
  
  return doc;
}

// Function to generate a teaching plan report PDF
export async function generateTeachingPlanPDF(
  plans: TeachingPlan[],
  teacherNames: Map<number, string>,
  type?: string,
  className?: string
): Promise<PDFDocument> {
  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Add header
  doc.fontSize(18).font('Helvetica-Bold').text('Nepal Central High School', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text('Teaching Plans Report', { align: 'center' });
  doc.fontSize(10).text('Narephat, Kathmandu', { align: 'center' });
  doc.moveDown(1);

  // Add report date
  const reportDate = new Date().toLocaleDateString();
  doc.fontSize(10).text(`Report Generated: ${reportDate}`, { align: 'right' });
  doc.moveDown(1);

  // Add filters if any
  if (type || className) {
    doc.fontSize(12).font('Helvetica-Bold');
    
    if (type) {
      doc.text(`Plan Type: ${type}`);
    }
    
    if (className) {
      doc.text(`Class: ${className}`);
    }
    
    doc.moveDown(0.5);
  }

  // If no plans found
  if (plans.length === 0) {
    doc.fontSize(12).font('Helvetica-Italic').text('No teaching plans found matching the criteria.', { align: 'center' });
  }

  // Loop through each plan
  for (const plan of plans) {
    doc.moveDown(1);
    
    // Start plan section with a line separator
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown(0.5);

    // Plan title and metadata
    doc.fontSize(14).font('Helvetica-Bold').text(plan.title);
    
    // Plan details
    doc.fontSize(10).font('Helvetica')
       .text(`Type: ${plan.type} | Class: ${plan.class}`, { continued: true })
       .text(` | Teacher: ${teacherNames.get(plan.teacherId) || 'Unknown'}`, { align: 'right' });
    
    // Date range
    const startDate = new Date(plan.startDate).toLocaleDateString();
    const endDate = new Date(plan.endDate).toLocaleDateString();
    doc.text(`Duration: ${startDate} to ${endDate}`);
    
    doc.moveDown(0.5);
    
    // Description
    doc.fontSize(12).font('Helvetica-Bold').text('Description:');
    doc.fontSize(10).font('Helvetica').text(plan.description);
    doc.moveDown(0.5);
    
    // Activities
    doc.fontSize(12).font('Helvetica-Bold').text('Activities:');
    doc.fontSize(10).font('Helvetica').text(plan.activities);
    doc.moveDown(0.5);
    
    // Goals
    doc.fontSize(12).font('Helvetica-Bold').text('Learning Goals:');
    doc.fontSize(10).font('Helvetica').text(plan.goals);
    
    // Add a page break after each plan except the last one
    if (plan !== plans[plans.length - 1]) {
      doc.addPage();
    }
  }
  
  // Add footer with page numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc.moveTo(50, doc.page.height - 50)
       .lineTo(550, doc.page.height - 50)
       .stroke();
       
    // Page number and system info
    doc.fontSize(8).font('Helvetica')
       .text(
         `Page ${i + 1} of ${totalPages} | Nepal Central High School Pre-Primary System`,
         50,
         doc.page.height - 40,
         { align: 'center' }
       );
  }
  
  // Finalize PDF
  doc.end();
  
  return doc;
}
