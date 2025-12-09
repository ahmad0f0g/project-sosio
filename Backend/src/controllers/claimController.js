import Claim from "../models/Claim.js";
import Report from "../models/Report.js";

export const createClaim = async (req, res) => {
  try {
    // Frontend mengirim JSON: { answers: { secret1: "...", ... } }
    const { reportId, name, reason, answers, pin } = req.body;

    if(!pin) return res.status(400).json({message: "Wajib membuat PIN keamanan!"});

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Barang tidak ditemukan." });

    // Cegah duplikasi klaim pending
    const existing = await Claim.findOne({ reportId, name, status: 'pending' });
    if(existing) return res.status(400).json({ message: "Klaim sedang diproses." });

    const claim = await Claim.create({
      reportId,
      name,
      reason,
      pin,
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

// ... (kode createClaim yang sudah ada)

// GET CLAIM STATUS (Cek status klaim public)
export const getClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.query;

    // Cari klaim dan ambil data report terkait (termasuk phone)
    const claim = await Claim.findById(id).populate("reportId", "phone finderName title");

    if (!claim) {
      return res.status(404).json({ message: "Data klaim tidak ditemukan." });
    }

    if (claim.pin !== pin) {
        return res.status(403).json({ 
            status: "forbidden", 
            message: "PIN Salah! Anda tidak berhak melihat data ini." 
        });
    }

    // LOGIKA PENTING: Hanya kirim No HP jika status APPROVED
    if (claim.status === "approved") {
      res.json({
        status: "approved",
        itemTitle: claim.reportId.title,
        finderName: claim.reportId.finderName,
        contactPhone: claim.reportId.phone, // INI YANG DICARI
        message: "Selamat! Klaim disetujui. Silakan hubungi penemu."
      });
    } else if (claim.status === "rejected") {
      res.json({
        status: "rejected",
        itemTitle: claim.reportId.title,
        message: "Maaf, klaim Anda ditolak karena jawaban tidak sesuai."
      });
    } else {
      res.json({
        status: "pending",
        itemTitle: claim.reportId.title,
        message: "Klaim masih menunggu verifikasi admin."
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};