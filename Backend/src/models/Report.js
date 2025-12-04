import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ["lost", "found"], default: "lost" },
    category: { type: String, required: true, enum: ["Elektronik", "Tas", "Aksesoris", "Dokumen", "Lainnya"] },
    location: { type: String, required: true },

    // TAMBAHAN BARU: No HP Pelapor
    phone: { type: String, required: true }, 

    images: [{ url: String, public_id: String }],
    status: { type: String, default: "available" },
    claimCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);