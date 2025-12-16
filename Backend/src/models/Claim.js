import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    name: { type: String, required: true },

    reason: { type: String, required: true },
    status: { type: String, default: "pending" },

    claimToken: { type: String, required: true, unique: true },

    answers: {
      answer1: { type: String }, 
      answer2: { type: String },
      answer3: { type: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Claim", claimSchema);