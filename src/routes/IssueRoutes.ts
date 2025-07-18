import { Router } from 'express';
import { createIssue, deleteIssue, exportToExcel, getAllIssues, getIssueById, getIssuesByNumber, getStats, solveIssue, updateIssue, updateSolvedTime } from '../controllers/issuesController';


const router = Router();

// Stats route
router.get('/stats', getStats);

// Export route
router.get('/export', exportToExcel);

// CRUD routes
router.post('/', createIssue);
router.get('/', getAllIssues);
router.get('/number/:issueNumber', getIssuesByNumber);
router.get('/:id', getIssueById);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);

// Solve issue route
router.patch('/:id/solve', solveIssue);

// Update solved time route
router.patch('/:id/solved-time', updateSolvedTime);

export default router;