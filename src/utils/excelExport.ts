import * as XLSX from 'xlsx';
import { IssueResponse, ExcelExportData } from '../types';

export class ExcelExportService {
  static generateExcelBuffer(issues: IssueResponse[]): Buffer {
    const excelData: ExcelExportData[] = issues.map(issue => {
      const submittedAt = new Date(issue.submittedAt);
      const solvedAt = issue.solvedAt ? new Date(issue.solvedAt) : null;
      
      let timeToSolve = '';
      if (solvedAt && issue.status === 'SOLVED') {
        const diffInMs = solvedAt.getTime() - submittedAt.getTime();
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));
        timeToSolve = diffInMinutes.toString();
      }

      return {
        'Issue Number': issue.issueNumber,
        'Location': issue.location,
        'Issue Type': issue.issueType,
        'Title': issue.title || '',
        'Description': issue.description || '',
        'Status': issue.status,
        'Submitted At': submittedAt.toLocaleString(),
        'Solved At': solvedAt ? solvedAt.toLocaleString() : '',
        'Time to Solve (minutes)': timeToSolve,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Issue Number
      { wch: 25 }, // Title
      { wch: 40 }, // Description
      { wch: 10 }, // Status
      { wch: 20 }, // Submitted At
      { wch: 20 }, // Solved At
      { wch: 20 }, // Time to Solve
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  static getExcelFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `issues-export-${dateStr}-${timeStr}.xlsx`;
  }
}