import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    church: {
      type: String,
      required: true,
      trim: true,
    },
    cell: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    imageUrl: {
      type: String, 
    },

    originalFileName: String,

    // metadata
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model("Submission", submissionSchema);