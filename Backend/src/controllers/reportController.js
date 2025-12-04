import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js"; // Pastikan path ../config/cloudinary.js benar

// Helper function: Upload stream dengan Promise
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
    // 1. Ambil data 'type' juga (lost/found)
    const { title, description, category, location, type, phone} = req.body;

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);

      uploadedImages = results.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    // 2. Simpan dengan field type
    const report = await Report.create({
      title,
      description,
      category,
      location,
      type: type || 'lost', // Default ke 'lost' jika kosong
      phone, 
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

// GET ALL REPORTS (Dengan Fitur Filter)
export const getReports = async (req, res) => {
  try {
    // Ambil query params dari URL (dikirim oleh frontend)
    const { type, category, search, limit } = req.query;

    let query = {};

    // Filter berdasarkan Tipe (Lost / Found)
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter berdasarkan Kategori
    if (category && category !== 'all') {
      query.category = category;
    }

    // Fitur Search (Mencari di Judul atau Lokasi)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },    // Case-insensitive
        { location: { $regex: search, $options: "i" } }
      ];
    }

    // Query ke database
    let reportsQuery = Report.find(query).sort({ createdAt: -1 });

    // Batasi jumlah jika ada parameter limit (misal untuk homepage)
    if (limit) {
      reportsQuery = reportsQuery.limit(parseInt(limit));
    }

    const reports = await reportsQuery;
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