"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportService = void 0;
const XLSX = __importStar(require("xlsx"));
const timeUtils_1 = require("./timeUtils");
class ExcelExportService {
    static generateExcelBuffer(issues) {
        const excelData = issues.map(issue => {
            const submittedAt = new Date(issue.submittedAt);
            const solvedAt = issue.solvedAt ? new Date(issue.solvedAt) : null;
            let timeToSolve = '';
            if (solvedAt && issue.status === 'SOLVED') {
                const diffInMs = solvedAt.getTime() - submittedAt.getTime();
                timeToSolve = (0, timeUtils_1.formatDuration)(diffInMs);
            }
            return {
                'Issue Number': issue.issueNumber,
                'Location': issue.location,
                'Issue Type': issue.issueType,
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
            { wch: 10 }, // Status
            { wch: 20 }, // Submitted At
            { wch: 20 }, // Solved At
            { wch: 20 }, // Time to Solve
        ];
        worksheet['!cols'] = columnWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    static getExcelFilename() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `issues-export-${dateStr}-${timeStr}.xlsx`;
    }
}
exports.ExcelExportService = ExcelExportService;
//# sourceMappingURL=excelExport.js.map