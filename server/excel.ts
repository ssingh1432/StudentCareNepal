import ExcelJS from 'exceljs';

/**
 * Generates an Excel report
 * @param type Type of report ('student-progress' or 'teaching-plan')
 * @param data Report data
 * @returns Excel buffer
 */
export async function generateExcel(type: string, data: any): Promise<Buffer> {
  // Create new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nepal Central High School';
  workbook.created = new Date();
  
  // Add content based on report type
  if (type === 'student-progress') {
    await addStudentProgressWorksheet(workbook, data);
  } else if (type === 'teaching-plan') {
    await addTeachingPlanWorksheet(workbook, data);
  }
  
  // Return Excel as buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}

/**
 * Adds student progress worksheet
 */
async function addStudentProgressWorksheet(workbook: ExcelJS.Workbook, data: any): Promise<void> {
  // Create worksheet
  const worksheet = workbook.addWorksheet('Student Progress');
  
  // Set up columns
  worksheet.columns = [
    { header: 'Student Name', key: 'name', width: 20 },
    { header: 'Class', key: 'class', width: 10 },
    { header: 'Age', key: 'age', width: 5 },
    { header: 'Learning Ability', key: 'learningAbility', width: 15 },
    { header: 'Writing Speed', key: 'writingSpeed', width: 15 },
    { header: 'Teacher', key: 'teacher', width: 20 },
    { header: 'Progress Date', key: 'date', width: 12 },
    { header: 'Social Skills', key: 'socialSkills', width: 15 },
    { header: 'Pre-Literacy', key: 'preLiteracy', width: 15 },
    { header: 'Pre-Numeracy', key: 'preNumeracy', width: 15 },
    { header: 'Motor Skills', key: 'motorSkills', width: 15 },
    { header: 'Emotional Dev.', key: 'emotionalDevelopment', width: 15 },
    { header: 'Comments', key: 'comments', width: 30 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '7C3AED' } // purple-600
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFF' }, bold: true };
  
  // Add data
  let rowIndex = 2;
  data.forEach(({ student, teacherName, progressEntries }) => {
    if (progressEntries && progressEntries.length > 0) {
      // Add each progress entry as a row
      progressEntries.forEach(entry => {
        worksheet.addRow({
          name: student.name,
          class: student.class,
          age: student.age,
          learningAbility: student.learningAbility,
          writingSpeed: student.writingSpeed || 'N/A',
          teacher: teacherName,
          date: new Date(entry.date).toLocaleDateString('en-US'),
          socialSkills: entry.socialSkills,
          preLiteracy: entry.preLiteracy,
          preNumeracy: entry.preNumeracy,
          motorSkills: entry.motorSkills,
          emotionalDevelopment: entry.emotionalDevelopment,
          comments: entry.comments || ''
        });
        
        rowIndex++;
      });
    } else {
      // Add student with no progress entries
      worksheet.addRow({
        name: student.name,
        class: student.class,
        age: student.age,
        learningAbility: student.learningAbility,
        writingSpeed: student.writingSpeed || 'N/A',
        teacher: teacherName,
        date: '',
        socialSkills: 'No data',
        preLiteracy: 'No data',
        preNumeracy: 'No data',
        motorSkills: 'No data',
        emotionalDevelopment: 'No data',
        comments: ''
      });
      
      rowIndex++;
    }
  });
  
  // Add filters
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 13 }
  };
  
  // Add conditional formatting
  worksheet.addConditionalFormatting({
    ref: 'H2:L' + rowIndex,
    rules: [
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'Excellent',
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'C6F6D5' } } // green-100
        }
      },
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'Good',
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FEF3C7' } } // yellow-100
        }
      },
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'Needs Improvement',
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FEE2E2' } } // red-100
        }
      }
    ]
  });
}

/**
 * Adds teaching plan worksheet
 */
async function addTeachingPlanWorksheet(workbook: ExcelJS.Workbook, data: any): Promise<void> {
  // Create worksheet
  const worksheet = workbook.addWorksheet('Teaching Plans');
  
  // Set up columns
  worksheet.columns = [
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Class', key: 'class', width: 10 },
    { header: 'Start Date', key: 'startDate', width: 12 },
    { header: 'End Date', key: 'endDate', width: 12 },
    { header: 'Created By', key: 'teacher', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Activities', key: 'activities', width: 40 },
    { header: 'Goals', key: 'goals', width: 40 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '7C3AED' } // purple-600
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFF' }, bold: true };
  
  // Add data
  data.forEach(({ plan, teacherName }) => {
    worksheet.addRow({
      title: plan.title,
      type: plan.type,
      class: plan.class,
      startDate: new Date(plan.startDate).toLocaleDateString('en-US'),
      endDate: new Date(plan.endDate).toLocaleDateString('en-US'),
      teacher: teacherName,
      description: plan.description,
      activities: plan.activities,
      goals: plan.goals
    });
  });
  
  // Add filters
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 6 }
  };
  
  // Wrap text in long columns
  ['G', 'H', 'I'].forEach(col => {
    worksheet.getColumn(col).eachCell({ includeEmpty: false }, cell => {
      cell.alignment = { wrapText: true, vertical: 'top' };
    });
  });
}
