import { Router } from 'express';
import {
  createLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequest,
  listLeaveRequests,
  updateLeaveRequest,
} from '../controllers/leaveRequestController.js';
import {
  approveLeaveRequest,
  getLeaveBalances,
  listMyLeaveRequests,
  rejectLeaveRequest,
} from '../controllers/leaveWorkflowController.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.use(auth);
router.post('/', requireRole('employee'), createLeaveRequest);
router.get('/', listLeaveRequests);
router.get('/mine', listMyLeaveRequests);
router.get('/balance', getLeaveBalances);
router.patch('/:id/approve', requireRole('manager'), approveLeaveRequest);
router.patch('/:id/reject', requireRole('manager'), rejectLeaveRequest);
router.get('/:id', getLeaveRequest);
router.put('/:id', updateLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

export default router;
