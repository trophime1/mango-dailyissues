import { IssueType, Status } from "@prisma/client";
export interface CreateIssueRequest {
    issueNumber: string;
    location: string;
    issueType: IssueType;
}
export interface UpdateIssueRequest {
    location?: string;
    issueType?: IssueType;
    status?: 'OPEN' | 'SOLVED';
    solvedAt?: Date | string | null;
    submittedAt?: Date | string | null;
}
export interface IssueResponse {
    id: string;
    issueNumber: string;
    location: string;
    issueType: IssueType;
    status: Status;
    submittedAt: Date;
    solvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExcelExportData {
    'Issue Number': string;
    'Location': string;
    'Issue Type': IssueType;
    'Status': string;
    'Submitted At': string;
    'Solved At': string;
    'Time to Solve': string;
}
//# sourceMappingURL=index.d.ts.map