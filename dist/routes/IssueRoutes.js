"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issuesController_1 = require("../controllers/issuesController");
const router = (0, express_1.Router)();
// Stats route
router.get('/stats', issuesController_1.getStats);
// Export route
router.get('/export', issuesController_1.exportToExcel);
// CRUD routes
router.post('/', issuesController_1.createIssue);
router.get('/', issuesController_1.getAllIssues);
router.get('/number/:issueNumber', issuesController_1.getIssuesByNumber);
router.get('/:id', issuesController_1.getIssueById);
router.put('/:id', issuesController_1.updateIssue);
router.delete('/:id', issuesController_1.deleteIssue);
// Solve issue route
router.patch('/:id/solve', issuesController_1.solveIssue);
// Update solved time route
router.patch('/:id/solved-time', issuesController_1.updateSolvedTime);
// Update submitted time route
router.patch('/:id/submitted-time', issuesController_1.updateSubmittedTime);
exports.default = router;
//# sourceMappingURL=IssueRoutes.js.map