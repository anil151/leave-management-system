import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    defaultDaysPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

export default LeaveType;
