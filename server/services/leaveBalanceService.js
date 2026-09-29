import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';

export const calculateLeaveBalances = async (employeeId, year = new Date().getUTCFullYear()) => {
  const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));

  const [leaveTypes, usage] = await Promise.all([
    LeaveType.find().sort({ name: 1 }).lean(),
    LeaveRequest.aggregate([
      {
        $match: {
          employee: employeeObjectId,
          status: 'approved',
          startDate: { $gte: startOfYear, $lt: startOfNextYear },
        },
      },
      {
        $group: {
          _id: '$leaveType',
          daysUsed: { $sum: '$daysRequested' },
        },
      },
    ]),
  ]);

  const daysUsedByType = new Map(
    usage.map(({ _id, daysUsed }) => [_id.toString(), daysUsed]),
  );

  return leaveTypes.map((leaveType) => {
    const daysUsed = daysUsedByType.get(leaveType._id.toString()) || 0;
    const daysRemaining = Math.max(leaveType.defaultDaysPerYear - daysUsed, 0);

    return {
      leaveType,
      defaultDaysPerYear: leaveType.defaultDaysPerYear,
      daysUsed,
      daysRemaining,
    };
  });
};
