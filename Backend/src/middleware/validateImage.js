// import detectSensitiveDocument from "../utils/detectSensitiveDocument.js"; // HAPUS INI
// import ocrCheck from "../utils/ocrCheck.js"; // HAPUS INI
import cloudinaryModeration from "../services/cloudinaryModeration.js"; // Ini boleh dipakai kalau hanya API Call

const validateImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      return next();

    // --- MODERASI LOKAL DIMATIKAN DEMI VERCEL ---
    // Fitur Sharp & Tesseract terlalu berat untuk Serverless Free Tier
    // Kita skip pengecekan KTP/OCR lokal.
    
    // Jika Anda ingin tetap pakai Cloudinary Moderation (karena itu di server orang lain, aman):
    /*
    for (const file of req.files) {
      const aiFlagged = await cloudinaryModeration(file.buffer);
      if (aiFlagged) {
        return res.status(400).json({
          message: "Foto diblokir oleh AI moderasi Cloudinary.",
        });
      }
    }
    */

    // Langsung lanjut saja (Bypass validasi sementara agar server jalan)
    next();
    
  } catch (error) {
    console.error("Image validation error:", error);
    // Jangan memblokir request jika validasi error, biarkan lanjut
    next(); 
  }
};

export default validateImage;