import detectSensitiveDocument from "../utils/detectSensitiveDocument.js";
import ocrCheck from "../utils/ocrCheck.js";
import cloudinaryModeration from "../services/cloudinaryModeration.js";

const validateImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      return next();

    for (const file of req.files) {
      // 1. Moderasi Manual: deteksi pola foto sensitive (KTP, paspor, KTM)
      const isSensitive = await detectSensitiveDocument(file.buffer);
      if (isSensitive) {
        return res
          .status(400)
          .json({ message: "Foto terindikasi dokumen pribadi dan tidak boleh diupload." });
      }

      // 2. OCR untuk deteksi teks sensitif (NIK, PASPOR, UNIVERSITAS, dsb.)
      const containsSensitiveText = await ocrCheck(file.buffer);
      if (containsSensitiveText) {
        return res.status(400).json({
          message: "Foto mengandung informasi identitas pribadi.",
        });
      }

      // 3. Moderasi AI Cloudinary
      const aiFlagged = await cloudinaryModeration(file.buffer);
      if (aiFlagged) {
        return res.status(400).json({
          message: "Foto diblokir oleh AI moderasi Cloudinary.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Image validation error:", error);
    return res.status(500).json({
      message: "Gagal memvalidasi foto.",
    });
  }
};

export default validateImage;
