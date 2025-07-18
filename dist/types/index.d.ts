import { IssueType, Status } from "@prisma/client";
export interface CreateIssueRequest {
    issueNumber: string;
    title?: string;
    description?: string;
    location: string;
    issueType: IssueType;
}
export interface UpdateIssueRequest {
    title?: string;
    description?: string;
    location?: string;
    issueType?: IssueType;
    status?: 'OPEN' | 'SOLVED';
    solvedAt?: Date | string | null;
}
export interface IssueResponse {
    id: string;
    issueNumber: string;
    location: string;
    issueType: IssueType;
    title?: string | null;
    description?: string | null;
    status: Status;
    submittedAt: Date;
    solvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExcelExportData {
    'Issue Number': string;
    'Title': string;
    'Description': string;
    'Location': string;
    'Issue Type': IssueType;
    'Status': string;
    'Submitted At': string;
    'Solved At': string;
    'Time to Solve': string;
}
//# sourceMappingURL=index.d.ts.map