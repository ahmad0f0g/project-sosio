import Report from "../models/Report.js";
import Claim from "../models/Claim.js";
import cloudinary from "../config/cloudinary.js"; 

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "temuin_uploads" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export const createReport = async (req, res) => {
  try {
    const { 
      title, description, category, location, 
      type, phone, reporter, date, 
      secret1, secret2, secret3 
    } = req.body;

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);

      uploadedImages = results.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    const report = await Report.create({
      title,
      description,
      category,
      location,
      type: type || 'found',
      phone, 
      images: uploadedImages,
      finderName: reporter, 
      dateFound: date,
      status: 'unclaimed',
      
      secrets: {
        answer1: secret1,
        answer2: secret2,
        answer3: secret3 || ""
      }
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

export const getReports = async (req, res) => {
  try {
    const { type, category, search, limit } = req.query;
    let query = { status: { $ne: 'finished' } }; 

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    let reportsQuery = Report.find(query).select('-secrets').sort({ createdAt: -1 });

    if (limit) reportsQuery = reportsQuery.limit(parseInt(limit));

    const reports = await reportsQuery;
    res.json({ data: reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select('-secrets');
    if (!report) return res.status(404).json({ message: req.t("REPORT_NOT_FOUND") });
    res.json({ data: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    if (req.headers.authorization !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Unauthorized: Password Admin Salah" });
    }

    const { id } = req.params;
    
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    await Claim.deleteMany({ reportId: id });
    
    res.json({ message: "Postingan berhasil dihapus permanen." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};