import { Request, Response } from 'express';
import prisma from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandle';
import { CreateIssueRequest, UpdateIssueRequest } from '../types';
import { ExcelExportService } from '../utils/excelExport';
import { formatDuration } from '../utils/timeUtils';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { issueNumber, location, issueType }: CreateIssueRequest = req.body;

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
  const { location, issueType, status, solvedAt, submittedAt }: UpdateIssueRequest = req.body;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  const updateData: any = {};
  
  if (location !== undefined) updateData.location = location;
  if (issueType !== undefined) updateData.issueType = issueType;
  
  // Handle status and solvedAt updates
  if (status !== undefined) {
    updateData.status = status;
    
    // If status is being changed to SOLVED and no custom solvedAt is provided
    if (status === 'SOLVED' && existingIssue.status !== 'SOLVED' && solvedAt === undefined) {
      updateData.solvedAt = new Date();
    }
    // If status is being changed to OPEN, clear solvedAt unless explicitly provided
    else if (status === 'OPEN' && solvedAt === undefined) {
      updateData.solvedAt = null;
    }
  }
  
  // Handle manual solvedAt updates (this takes precedence over automatic setting)
  if (solvedAt !== undefined) {
    if (solvedAt === null) {
      updateData.solvedAt = null;
      if (status === undefined) {
        updateData.status = 'OPEN';
      }
    } else {
      const newSolvedAt = new Date(solvedAt);
      // Validate that solvedAt is not before submittedAt
      const submittedDate = submittedAt !== undefined && submittedAt !== null ? new Date(submittedAt) : existingIssue.submittedAt;
      if (submittedDate >= newSolvedAt) {
        throw new AppError('Solved time cannot be before or equal to submitted time', 400);
      }
      updateData.solvedAt = newSolvedAt;
      if (status === undefined) {
        updateData.status = 'SOLVED';
      }
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

export const updateSolvedTime = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { solvedAt } = req.body;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  // Validate solvedAt format if provided
  if (solvedAt && isNaN(Date.parse(solvedAt))) {
    throw new AppError('Invalid date format for solvedAt', 400);
  }

  const updateData: any = {};
  
  if (solvedAt === null || solvedAt === '') {
    // Clearing solved time - set to OPEN
    updateData.solvedAt = null;
    updateData.status = 'OPEN';
  } else {
    // Setting solved time - set to SOLVED
    updateData.solvedAt = new Date(solvedAt);
    updateData.status = 'SOLVED';
    
    // Validate that solvedAt is not before submittedAt
    if (updateData.solvedAt <= existingIssue.submittedAt) {
      throw new AppError('Solved time cannot be before or equal to submitted time', 400);
    }
  }

  const updatedIssue = await prisma.issue.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    data: updatedIssue,
    message: 'Solved time updated successfully',
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
  let avgSolveTimeFormatted = '0m';
  if (solvedIssuesWithTimes.length > 0) {
    const totalSolveTime = solvedIssuesWithTimes.reduce((total, issue) => {
      const diffInMs = issue.solvedAt!.getTime() - issue.submittedAt.getTime();
      return total + diffInMs;
    }, 0);
    
    const avgSolveTimeMs = totalSolveTime / solvedIssuesWithTimes.length;
    avgSolveTimeMinutes = Math.round(avgSolveTimeMs / (1000 * 60));
    
    // Use imported formatDuration for consistent formatting
    avgSolveTimeFormatted = formatDuration(avgSolveTimeMs);
  }

  res.json({
    success: true,
    data: {
      totalClaims: totalIssues,
      openClaims: openIssues,
      solvedClaims: solvedIssues,
      uniqueIssueNumbers: uniqueIssueNumbers.length,
      todayClaims: todayIssues,
      avgSolveTimeMinutes, // Keep for backward compatibility
      avgSolveTimeFormatted, // New formatted version
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
      },
    },
  });
});

export const updateSubmittedTime = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { submittedAt } = req.body;

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
  });

  if (!existingIssue) {
    throw new AppError('Issue not found', 404);
  }

  // Validate submittedAt format if provided
  if (!submittedAt || isNaN(Date.parse(submittedAt))) {
    throw new AppError('Invalid date format for submittedAt', 400);
  }

  const newSubmittedAt = new Date(submittedAt);
  // Validate that submittedAt is not after solvedAt
  if (existingIssue.solvedAt && newSubmittedAt >= existingIssue.solvedAt) {
    throw new AppError('Submitted time cannot be after or equal to solved time', 400);
  }

  const updatedIssue = await prisma.issue.update({
    where: { id },
    data: { submittedAt: newSubmittedAt },
  });

  res.json({
    success: true,
    data: updatedIssue,
    message: 'Submitted time updated successfully',
  });
});