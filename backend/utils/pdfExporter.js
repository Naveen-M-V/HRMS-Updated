const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF report with formatted tables and summaries
 * @param {Object} reportData - Full report data from controller
 * @param {String} outputPath - Path to save PDF (optional, if not provided returns stream)
 * @returns {PDFDocument} PDF document stream
 */
const generatePDFReport = (reportData) => {
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50,
    bufferPages: true
  });

  // Header
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('HRMS Report Library', { align: 'center' })
     .moveDown(0.5);

  // Report Title
  const reportTitles = {
    'absence': 'Absence Report',
    'annual-leave': 'Annual Leave Report',
    'lateness': 'Lateness Report',
    'overtime': 'Overtime Report',
    'rota': 'Rota Schedule Report',
    'sickness': 'Sickness Report',
    'employee-details': 'Employee Details Report',
    'payroll-exceptions': 'Payroll Exceptions Report',
    'expenses': 'Expenses Report',
    'length-of-service': 'Length of Service Report',
    'turnover': 'Turnover & Retention Report',
    'working-status': 'Working Status Report',
    'sensitive-info': 'Sensitive Information Report',
    'furloughed': 'Furloughed Employees Report'
  };

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text(reportTitles[reportData.reportType] || 'Report', { align: 'center' })
     .moveDown(0.5);

  // Date Range (if applicable)
  if (reportData.dateRange) {
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Period: ${formatDate(reportData.dateRange.startDate)} to ${formatDate(reportData.dateRange.endDate)}`, 
             { align: 'center' })
       .moveDown(0.5);
  }

  // Generated Date
  doc.fontSize(8)
     .fillColor('#666666')
     .text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' })
     .fillColor('#000000')
     .moveDown(1);

  // Horizontal line
  doc.moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke()
     .moveDown(1);

  // Summary Section
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Summary', { underline: true })
     .moveDown(0.5);

  doc.fontSize(10)
     .font('Helvetica')
     .text(`Total Records: ${reportData.totalRecords || reportData.records?.length || 0}`)
     .moveDown(0.5);

  // Report-specific summaries
  addReportSummary(doc, reportData);

  doc.moveDown(1);

  // Records Table
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Detailed Records', { underline: true })
     .moveDown(0.5);

  // Add table based on report type
  addReportTable(doc, reportData);

  // Footer on each page
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor('#666666')
       .text(
         `Page ${i + 1} of ${pageCount}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       )
       .fillColor('#000000');
  }

  return doc;
};

/**
 * Add report-specific summary information
 */
const addReportSummary = (doc, reportData) => {
  const { reportType } = reportData;

  switch (reportType) {
    case 'absence':
      const totalDays = reportData.records?.reduce((sum, r) => sum + (r.totalAbsenceDays || 0), 0);
      doc.text(`Total Absence Days: ${totalDays || 0}`);
      break;

    case 'expenses':
      if (reportData.totals) {
        doc.text(`Pending: £${reportData.totals.pending?.toFixed(2) || '0.00'}`);
        doc.text(`Approved: £${reportData.totals.approved?.toFixed(2) || '0.00'}`);
        doc.text(`Paid: £${reportData.totals.paid?.toFixed(2) || '0.00'}`);
        doc.text(`Rejected: £${reportData.totals.rejected?.toFixed(2) || '0.00'}`);
      }
      break;

    case 'turnover':
      if (reportData.summary) {
        doc.text(`Starting Headcount: ${reportData.summary.startingHeadcount}`);
        doc.text(`Ending Headcount: ${reportData.summary.endingHeadcount}`);
        doc.text(`New Hires: ${reportData.summary.newHires}`);
        doc.text(`Terminations: ${reportData.summary.terminations}`);
        doc.text(`Turnover Rate: ${reportData.summary.turnoverRate}`);
      }
      break;

    case 'overtime':
      const totalOT = reportData.records?.reduce((sum, r) => sum + (r.totalOvertimeHours || 0), 0);
      const totalCost = reportData.records?.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      doc.text(`Total Overtime Hours: ${totalOT?.toFixed(2) || 0}`);
      doc.text(`Estimated Total Cost: £${totalCost?.toFixed(2) || 0}`);
      break;
  }

  doc.moveDown(0.5);
};

/**
 * Add formatted table for report records
 */
const addReportTable = (doc, reportData) => {
  const records = reportData.records || [];
  
  if (records.length === 0) {
    doc.fontSize(10)
       .fillColor('#999999')
       .text('No records found for this report period.', { align: 'center' })
       .fillColor('#000000');
    return;
  }

  // Table configuration by report type
  const tableConfigs = {
    'absence': {
      headers: ['Employee ID', 'Name', 'Department', 'Total Days', 'Instances'],
      widths: [80, 150, 120, 80, 80],
      fields: ['employeeId', 'fullName', 'department', 'totalAbsenceDays', 'totalInstances']
    },
    'lateness': {
      headers: ['Employee ID', 'Name', 'Total Incidents', 'Excused', 'Avg Minutes'],
      widths: [80, 150, 100, 80, 80],
      fields: ['employeeId', 'fullName', 'totalIncidents', 'excusedIncidents', 'averageMinutesLate']
    },
    'expenses': {
      headers: ['Date', 'Employee', 'Category', 'Amount', 'Status'],
      widths: [80, 150, 100, 80, 80],
      fields: ['date', 'employeeName', 'category', 'amount', 'status']
    },
    'sickness': {
      headers: ['Employee ID', 'Name', 'Days', 'Instances', 'Bradford', 'Risk'],
      widths: [70, 130, 60, 70, 70, 60],
      fields: ['employeeId', 'fullName', 'totalDays', 'instances', 'bradfordFactor', 'riskLevel']
    }
  };

  const config = tableConfigs[reportData.reportType] || {
    headers: Object.keys(records[0]).slice(0, 5),
    widths: [100, 100, 100, 100, 100],
    fields: Object.keys(records[0]).slice(0, 5)
  };

  // Draw table headers
  const startX = 50;
  let currentY = doc.y;

  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#333333');

  config.headers.forEach((header, i) => {
    const x = startX + config.widths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(header, x, currentY, { width: config.widths[i], continued: false });
  });

  currentY += 20;
  doc.moveTo(startX, currentY)
     .lineTo(startX + config.widths.reduce((a, b) => a + b, 0), currentY)
     .stroke();
  currentY += 5;

  // Draw table rows
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#000000');

  const maxRecords = 50; // Limit to prevent huge PDFs
  const recordsToShow = records.slice(0, maxRecords);

  recordsToShow.forEach((record, rowIndex) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    config.fields.forEach((field, colIndex) => {
      const x = startX + config.widths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      let value = record[field];

      // Format values
      if (value === null || value === undefined) {
        value = '-';
      } else if (typeof value === 'number') {
        value = value.toFixed(2);
      } else if (value instanceof Date) {
        value = formatDate(value);
      } else {
        value = String(value);
      }

      doc.text(value, x, currentY, { 
        width: config.widths[colIndex], 
        continued: false,
        ellipsis: true 
      });
    });

    currentY += 15;

    // Draw light separator line every 5 rows
    if ((rowIndex + 1) % 5 === 0) {
      doc.strokeColor('#EEEEEE')
         .moveTo(startX, currentY)
         .lineTo(startX + config.widths.reduce((a, b) => a + b, 0), currentY)
         .stroke()
         .strokeColor('#000000');
      currentY += 3;
    }
  });

  if (records.length > maxRecords) {
    doc.moveDown(1)
       .fontSize(8)
       .fillColor('#999999')
       .text(`Note: Showing first ${maxRecords} of ${records.length} records. Export to CSV for complete data.`, 
             { align: 'center' })
       .fillColor('#000000');
  }
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

/**
 * Export report to PDF and return as buffer
 */
const exportReportToPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = generatePDFReport(reportData);
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePDFReport,
  exportReportToPDF
};
