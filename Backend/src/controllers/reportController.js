import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js";// Pastikan path ini sesuai dengan struktur folder Anda

// Helper function: Bungkus upload_stream dengan Promise agar bisa di-await
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "lostfound" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// CREATE REPORT
export const createReport = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    // Array untuk menampung hasil upload
    let uploadedImages = [];

    // Cek apakah ada file yang diupload
    if (req.files && req.files.length > 0) {
      // Upload semua file secara paralel menggunakan Promise.all
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      
      // Tunggu sampai semua upload selesai
      const results = await Promise.all(uploadPromises);

      // Map hasil upload ke format yang diinginkan
      uploadedImages = results.map((img) => ({
        url: img.secure_url, // Gunakan secure_url agar selalu HTTPS
        public_id: img.public_id,
      }));
    }

    // Simpan ke database
    const report = await Report.create({
      title,
      description,
      category,
      location,
      images: uploadedImages,
    });

    res.status(201).json({
      message: req.t("REPORT_CREATED"),
      data: report,
    });
  } catch (error) {
    console.error("Create Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL REPORTS
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ data: reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE REPORT
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: req.t("REPORT_NOT_FOUND") });
    }

    res.json({ data: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};