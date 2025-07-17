import { IssueResponse } from '../types';
export declare class ExcelExportService {
    /**
     * Formats time duration from milliseconds to a readable format
     * @param milliseconds - Time duration in milliseconds
     * @returns Formatted string in "Xd Yh Zm" format
     */
    private static formatDuration;
    static generateExcelBuffer(issues: IssueResponse[]): Buffer;
    static getExcelFilename(): string;
}
//# sourceMappingURL=excelExport.d.ts.map