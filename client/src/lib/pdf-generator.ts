import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, Progress, TeachingPlan } from "@shared/schema";

// Configure common PDF settings
function setupPdf(title: string): jsPDF {
  const pdf = new jsPDF();
  
  // Add school header
  pdf.setFontSize(18);
  pdf.setTextColor(128, 58, 237); // Purple color
  pdf.text("Nepal Central High School", pdf.internal.pageSize.width / 2, 15, { align: "center" });
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Narephat, Kathmandu", pdf.internal.pageSize.width / 2, 22, { align: "center" });
  
  // Add document title
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, pdf.internal.pageSize.width / 2, 32, { align: "center" });
  
  // Add line under title
  pdf.setDrawColor(128, 58, 237);
  pdf.line(20, 35, pdf.internal.pageSize.width - 20, 35);
  
  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);
  
  return pdf;
}

// Add student info section
function addStudentInfo(pdf: jsPDF, student: Student, y: number = 50): number {
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Student: ${student.name}`, 20, y);
  pdf.text(`Class: ${student.class}`, 20, y + 7);
  pdf.text(`Age: ${student.age} years`, 120, y);
  pdf.text(`Learning Ability: ${student.learningAbility}`, 20, y + 14);
  pdf.text(`Writing Speed: ${student.writingSpeed}`, 120, y + 14);
  
  // Add photo if available
  if (student.photoUrl) {
    try {
      pdf.addImage(student.photoUrl, 'JPEG', 160, y, 30, 30);
    } catch (error) {
      console.error('Error adding student photo to PDF:', error);
    }
  }
  
  return y + 35; // Return the new Y position
}

// Generate student progress report
export function generateStudentProgressReport(
  student: Student,
  progressEntries: Progress[],
  includePhoto: boolean = true
): jsPDF {
  const pdf = setupPdf("Student Progress Report");
  
  let y = addStudentInfo(pdf, student);
  
  // Add progress table
  autoTable(pdf, {
    startY: y,
    head: [['Date', 'Social', 'Pre-Literacy', 'Pre-Numeracy', 'Motor', 'Emotional']],
    body: progressEntries.map(entry => [
      new Date(entry.date).toLocaleDateString(),
      entry.socialSkills,
      entry.preLiteracy,
      entry.preNumeracy,
      entry.motorSkills,
      entry.emotionalDevelopment
    ]),
    headStyles: { fillColor: [128, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });
  
  // Add comments section if available
  if (progressEntries.length > 0 && progressEntries.some(entry => entry.comments)) {
    y = (pdf as any).lastAutoTable.finalY + 10;
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Comments:", 20, y);
    
    y += 7;
    pdf.setFontSize(10);
    
    progressEntries.forEach(entry => {
      if (entry.comments) {
        pdf.text(`${new Date(entry.date).toLocaleDateString()}: ${entry.comments}`, 20, y);
        y += 7;
      }
    });
  }
  
  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - 10, { align: "center" });
  }
  
  return pdf;
}

// Generate class progress report
export function generateClassProgressReport(
  students: Student[],
  className: string
): jsPDF {
  const pdf = setupPdf(`${className} Class Progress Report`);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Class: ${className}`, 20, 50);
  pdf.text(`Total Students: ${students.length}`, 20, 57);
  
  // Add students table
  autoTable(pdf, {
    startY: 65,
    head: [['Name', 'Learning Ability', 'Writing Speed', 'Age']],
    body: students.map(student => [
      student.name,
      student.learningAbility,
      student.writingSpeed,
      `${student.age} years`
    ]),
    headStyles: { fillColor: [128, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });
  
  // Stats by learning ability
  const talentedCount = students.filter(s => s.learningAbility === "Talented").length;
  const averageCount = students.filter(s => s.learningAbility === "Average").length;
  const slowLearnerCount = students.filter(s => s.learningAbility === "Slow Learner").length;
  
  let y = (pdf as any).lastAutoTable.finalY + 15;
  
  pdf.setFontSize(12);
  pdf.text("Learning Ability Distribution:", 20, y);
  y += 10;
  
  pdf.setFontSize(10);
  pdf.text(`Talented: ${talentedCount} students (${Math.round(talentedCount / students.length * 100)}%)`, 30, y);
  y += 7;
  pdf.text(`Average: ${averageCount} students (${Math.round(averageCount / students.length * 100)}%)`, 30, y);
  y += 7;
  pdf.text(`Slow Learner: ${slowLearnerCount} students (${Math.round(slowLearnerCount / students.length * 100)}%)`, 30, y);
  
  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - 10, { align: "center" });
  }
  
  return pdf;
}

// Generate teaching plan report
export function generateTeachingPlanReport(
  plans: TeachingPlan[],
  title: string = "Teaching Plans Report"
): jsPDF {
  const pdf = setupPdf(title);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total Plans: ${plans.length}`, 20, 50);
  
  let y = 60;
  
  // For each plan, add a section
  plans.forEach((plan, index) => {
    // Check if we need a new page
    if (y > pdf.internal.pageSize.height - 50) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setTextColor(128, 58, 237);
    pdf.text(plan.title, 20, y);
    
    y += 7;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${plan.type} | ${plan.class} | ${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`, 20, y);
    
    y += 10;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Description:", 20, y);
    
    y += 7;
    const descriptionLines = pdf.splitTextToSize(plan.description, pdf.internal.pageSize.width - 40);
    pdf.setFontSize(10);
    pdf.text(descriptionLines, 30, y);
    
    y += descriptionLines.length * 5 + 5;
    
    pdf.setFontSize(11);
    pdf.text("Activities:", 20, y);
    
    y += 7;
    const activitiesLines = pdf.splitTextToSize(plan.activities, pdf.internal.pageSize.width - 40);
    pdf.setFontSize(10);
    pdf.text(activitiesLines, 30, y);
    
    y += activitiesLines.length * 5 + 5;
    
    pdf.setFontSize(11);
    pdf.text("Learning Goals:", 20, y);
    
    y += 7;
    const goalsLines = pdf.splitTextToSize(plan.goals, pdf.internal.pageSize.width - 40);
    pdf.setFontSize(10);
    pdf.text(goalsLines, 30, y);
    
    y += goalsLines.length * 5 + 15;
    
    // Add separator line
    if (index < plans.length - 1) {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, y - 5, pdf.internal.pageSize.width - 20, y - 5);
    }
  });
  
  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - 10, { align: "center" });
  }
  
  return pdf;
}
