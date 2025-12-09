import Claim from "../models/Claim.js";
import Report from "../models/Report.js";

export const createClaim = async (req, res) => {
  try {
    // Frontend mengirim JSON: { answers: { secret1: "...", ... } }
    const { reportId, name, reason, answers } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Barang tidak ditemukan." });

    // Cegah duplikasi klaim pending
    const existing = await Claim.findOne({ reportId, name, status: 'pending' });
    if(existing) return res.status(400).json({ message: "Klaim sedang diproses." });

    const claim = await Claim.create({
      reportId,
      name,
      reason,
      // Mapping jawaban penebak
      answers: {
        answer1: answers?.secret1 || "-",
        answer2: answers?.secret2 || "-",
        answer3: answers?.secret3 || "-"
      }
    });

    // Update status report jadi 'pending' (ada aktivitas)
    await Report.findByIdAndUpdate(reportId, { 
        status: 'pending',
        $inc: { claimCount: 1 } 
    });

    res.json({ message: req.t("CLAIM_SUBMITTED"), data: claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};