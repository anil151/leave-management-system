import { Router } from 'express';
import {
  createLeaveType,
  deleteLeaveType,
  getLeaveType,
  listLeaveTypes,
  updateLeaveType,
} from '../controllers/leaveTypeController.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.use(auth);
router.get('/', listLeaveTypes);
router.get('/:id', getLeaveType);
router.post('/', requireRole('manager'), createLeaveType);
router.put('/:id', requireRole('manager'), updateLeaveType);
router.delete('/:id', requireRole('manager'), deleteLeaveType);

export default router;
