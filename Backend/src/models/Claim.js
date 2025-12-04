import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    name: { type: String, required: true },

    // KITA HAPUS field phone dari sini karena pengklaim tidak wajib input
    // phone: { type: String, required: true }, 

    reason: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Claim", claimSchema);