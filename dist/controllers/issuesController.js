"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.exportToExcel = exports.solveIssue = exports.deleteIssue = exports.updateIssue = exports.getIssuesByNumber = exports.getIssueById = exports.getAllIssues = exports.createIssue = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandle_1 = require("../middleware/errorHandle");
const excelExport_1 = require("../utils/excelExport");
exports.createIssue = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { issueNumber, title, description, location, issueType } = req.body;
    if (!issueNumber) {
        throw new errorHandle_1.AppError('Issue number is required', 400);
    }
    if (!location) {
        throw new errorHandle_1.AppError('Location is required', 400);
    }
    if (!issueType) {
        throw new errorHandle_1.AppError('Issue type is required', 400);
    }
    const issue = await database_1.default.issue.create({
        data: {
            issueNumber,
            title,
            description,
            location,
            issueType,
        },
    });
    res.status(201).json({
        success: true,
        data: issue,
    });
});
exports.getAllIssues = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = status ? { status: status } : {};
    const [issues, total] = await Promise.all([
        database_1.default.issue.findMany({
            where,
            skip,
            take,
            orderBy: {
                [sortBy]: sortOrder,
            },
        }),
        database_1.default.issue.count({ where }),
    ]);
    res.json({
        success: true,
        data: {
            issues,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
    });
});
exports.getIssueById = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const issue = await database_1.default.issue.findUnique({
        where: { id },
    });
    if (!issue) {
        throw new errorHandle_1.AppError('Issue not found', 404);
    }
    res.json({
        success: true,
        data: issue,
    });
});
exports.getIssuesByNumber = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { issueNumber } = req.params;
    const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const [issues, total] = await Promise.all([
        database_1.default.issue.findMany({
            where: { issueNumber },
            skip,
            take,
            orderBy: {
                [sortBy]: sortOrder,
            },
        }),
        database_1.default.issue.count({ where: { issueNumber } }),
    ]);
    if (issues.length === 0) {
        throw new errorHandle_1.AppError('No issues found with this issue number', 404);
    }
    res.json({
        success: true,
        data: {
            issues,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
    });
});
exports.updateIssue = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { title, description, location, issueType, status } = req.body;
    const existingIssue = await database_1.default.issue.findUnique({
        where: { id },
    });
    if (!existingIssue) {
        throw new errorHandle_1.AppError('Issue not found', 404);
    }
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (location !== undefined)
        updateData.location = location;
    if (issueType !== undefined)
        updateData.issueType = issueType;
    // If status is being changed to SOLVED, set solvedAt timestamp
    if (status !== undefined) {
        updateData.status = status;
        if (status === 'SOLVED' && existingIssue.status !== 'SOLVED') {
            updateData.solvedAt = new Date();
        }
        if (status === 'OPEN') {
            updateData.solvedAt = null;
        }
    }
    const updatedIssue = await database_1.default.issue.update({
        where: { id },
        data: updateData,
    });
    res.json({
        success: true,
        data: updatedIssue,
    });
});
exports.deleteIssue = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingIssue = await database_1.default.issue.findUnique({
        where: { id },
    });
    if (!existingIssue) {
        throw new errorHandle_1.AppError('Issue not found', 404);
    }
    await database_1.default.issue.delete({
        where: { id },
    });
    res.json({
        success: true,
        message: 'Issue deleted successfully',
    });
});
exports.solveIssue = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingIssue = await database_1.default.issue.findUnique({
        where: { id },
    });
    if (!existingIssue) {
        throw new errorHandle_1.AppError('Issue not found', 404);
    }
    if (existingIssue.status === 'SOLVED') {
        throw new errorHandle_1.AppError('Issue is already solved', 400);
    }
    const updatedIssue = await database_1.default.issue.update({
        where: { id },
        data: {
            status: 'SOLVED',
            solvedAt: new Date(),
        },
    });
    res.json({
        success: true,
        data: updatedIssue,
    });
});
exports.exportToExcel = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { status, startDate, endDate } = req.query;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (startDate || endDate) {
        where.submittedAt = {};
        if (startDate) {
            where.submittedAt.gte = new Date(startDate);
        }
        if (endDate) {
            where.submittedAt.lte = new Date(endDate);
        }
    }
    const issues = await database_1.default.issue.findMany({
        where,
        orderBy: {
            submittedAt: 'desc',
        },
    });
    const excelBuffer = excelExport_1.ExcelExportService.generateExcelBuffer(issues);
    const filename = excelExport_1.ExcelExportService.getExcelFilename();
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
    });
    res.send(excelBuffer);
});
exports.getStats = (0, errorHandle_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.submittedAt = {};
        if (startDate) {
            dateFilter.submittedAt.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.submittedAt.lte = new Date(endDate);
        }
    }
    const [totalIssues, openIssues, solvedIssues, uniqueIssueNumbers, todayIssues,] = await Promise.all([
        database_1.default.issue.count({ where: dateFilter }),
        database_1.default.issue.count({ where: { ...dateFilter, status: 'OPEN' } }),
        database_1.default.issue.count({ where: { ...dateFilter, status: 'SOLVED' } }),
        database_1.default.issue.groupBy({
            by: ['issueNumber'],
            where: dateFilter,
            _count: {
                issueNumber: true,
            },
        }),
        database_1.default.issue.count({
            where: {
                submittedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
        }),
    ]);
    // Calculate average solve time manually
    const solvedIssuesWithTimes = await database_1.default.issue.findMany({
        where: {
            ...dateFilter,
            status: 'SOLVED',
            solvedAt: { not: null },
        },
        select: {
            submittedAt: true,
            solvedAt: true,
        },
    });
    let avgSolveTimeMinutes = 0;
    if (solvedIssuesWithTimes.length > 0) {
        const totalSolveTime = solvedIssuesWithTimes.reduce((total, issue) => {
            const diffInMs = issue.solvedAt.getTime() - issue.submittedAt.getTime();
            return total + diffInMs;
        }, 0);
        avgSolveTimeMinutes = Math.round(totalSolveTime / (solvedIssuesWithTimes.length * 1000 * 60));
    }
    res.json({
        success: true,
        data: {
            totalClaims: totalIssues,
            openClaims: openIssues,
            solvedClaims: solvedIssues,
            uniqueIssueNumbers: uniqueIssueNumbers.length,
            todayClaims: todayIssues,
            avgSolveTimeMinutes,
            period: {
                startDate: startDate || 'All time',
                endDate: endDate || 'All time',
            },
        },
    });
});
//# sourceMappingURL=issuesController.js.map