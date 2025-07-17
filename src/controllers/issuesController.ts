import { Request, Response } from 'express';
import prisma from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandle';
import { CreateIssueRequest, UpdateIssueRequest } from '../types';
import { ExcelExportService } from '../utils/excelExport';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { issueNumber, title, description, location, issueType }: CreateIssueRequest = req.body;

  if (!issueNumber) {
    throw new AppError('Issue number is required', 400);
  }

  if (!location) {
    throw new AppError('Location is required', 400);
  }

  if (!issueType) {
    throw new AppError('Issue type is required', 400);
  }

  const issue = await prisma.issue.create({
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

export const getAllIssues = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = status ? { status: status as 'OPEN' | 'SOLVED' } : {};

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
    }),
    prisma.issue.count({ where }),
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

export const getIssueById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const issue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!issue) {
    throw new AppError('Issue not found', 404);
  }

  res.json({
    success: true,
    data: issue,
  });
});

export const getIssuesByNumber = asyncHandler(async (req: Request, res: Response) => {
  const { issueNumber } = req.params;
  const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where: { issueNumber },
      skip,
      take,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
    }),
    prisma.issue.count({ where: { issueNumber } }),
  ]);

  if (issues.length === 0) {
    throw new AppError('No issues found with this issue number', 404);
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

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, location, issueType, status }: UpdateIssueRequest = req.body;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  const updateData: any = {};
  
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (location !== undefined) updateData.location = location;
  if (issueType !== undefined) updateData.issueType = issueType;
  
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

  const updatedIssue = await prisma.issue.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    data: updatedIssue,
  });
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  await prisma.issue.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Issue deleted successfully',
  });
});

export const solveIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  if (existingIssue.status === 'SOLVED') {
    throw new AppError('Issue is already solved', 400);
  }

  const updatedIssue = await prisma.issue.update({
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

export const exportToExcel = asyncHandler(async (req: Request, res: Response) => {
  const { status, startDate, endDate } = req.query;

  const where: any = {};
  
  if (status) {
    where.status = status as 'OPEN' | 'SOLVED';
  }

  if (startDate || endDate) {
    where.submittedAt = {};
    if (startDate) {
      where.submittedAt.gte = new Date(startDate as string);
    }
    if (endDate) {
      where.submittedAt.lte = new Date(endDate as string);
    }
  }

  const issues = await prisma.issue.findMany({
    where,
    orderBy: {
      submittedAt: 'desc',
    },
  });

  const excelBuffer = ExcelExportService.generateExcelBuffer(issues);
  const filename = ExcelExportService.getExcelFilename();

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': excelBuffer.length.toString(),
  });

  res.send(excelBuffer);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  // Build date filter if provided
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.submittedAt = {};
    if (startDate) {
      dateFilter.submittedAt.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.submittedAt.lte = new Date(endDate as string);
    }
  }

  const [
    totalIssues,
    openIssues,
    solvedIssues,
    uniqueIssueNumbers,
    todayIssues,
  ] = await Promise.all([
    prisma.issue.count({ where: dateFilter }),
    prisma.issue.count({ where: { ...dateFilter, status: 'OPEN' } }),
    prisma.issue.count({ where: { ...dateFilter, status: 'SOLVED' } }),
    prisma.issue.groupBy({
      by: ['issueNumber'],
      where: dateFilter,
      _count: {
        issueNumber: true,
      },
    }),
    prisma.issue.count({
      where: {
        submittedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  // Calculate average solve time manually
  const solvedIssuesWithTimes = await prisma.issue.findMany({
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
      const diffInMs = issue.solvedAt!.getTime() - issue.submittedAt.getTime();
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