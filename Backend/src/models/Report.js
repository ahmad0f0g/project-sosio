import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["lost", "found"], default: "found" }, 
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateFound: { type: String, required: true }, 

    finderName: { type: String, required: true },
    phone: { type: String, required: true },

    images: [{ url: String, public_id: String }],
    
    status: { 
        type: String, 
        enum: ["pending", "unclaimed", "claimed", "finished"], 
        default: "unclaimed" 
    },
    claimCount: { type: Number, default: 0 },

    secrets: {
      answer1: { type: String, required: true },
      answer2: { type: String, required: true },
      answer3: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);