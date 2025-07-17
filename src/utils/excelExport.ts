import * as XLSX from 'xlsx';
import { IssueResponse, ExcelExportData } from '../types';

export class ExcelExportService {
  /**
   * Formats time duration from milliseconds to a readable format
   * @param milliseconds - Time duration in milliseconds
   * @returns Formatted string in "Xd Yh Zm" format
   */
  private static formatDuration(milliseconds: number): string {
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    if (totalHours < 24) {
      return remainingMinutes > 0 
        ? `${totalHours}h ${remainingMinutes}m`
        : `${totalHours}h`;
    }
    
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    
    let result = `${days}d`;
    if (remainingHours > 0) {
      result += ` ${remainingHours}h`;
    }
    if (remainingMinutes > 0) {
      result += ` ${remainingMinutes}m`;
    }
    
    return result;
  }
  static generateExcelBuffer(issues: IssueResponse[]): Buffer {
    const excelData: ExcelExportData[] = issues.map(issue => {
      const submittedAt = new Date(issue.submittedAt);
      const solvedAt = issue.solvedAt ? new Date(issue.solvedAt) : null;
      
      let timeToSolve = '';
      if (solvedAt && issue.status === 'SOLVED') {
        const diffInMs = solvedAt.getTime() - submittedAt.getTime();
        timeToSolve = this.formatDuration(diffInMs);
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
        'Time to Solve': timeToSolve,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Issue Number
      { wch: 25 }, // Location
      { wch: 15 }, // Issue Type
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