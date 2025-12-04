import Claim from "../models/Claim.js";
import Report from "../models/Report.js";

// CREATE CLAIM
export const createClaim = async (req, res) => {
  try {
    const { reportId, name, reason } = req.body;

    const claim = await Claim.create({
      reportId,
      name,
      reason,
    });

    // Tambah jumlah klaim
    await Report.findByIdAndUpdate(reportId, {
      $inc: { claimCount: 1 },
    });

    res.json({
      message: req.t("CLAIM_SUBMITTED"),
      data: claim,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
