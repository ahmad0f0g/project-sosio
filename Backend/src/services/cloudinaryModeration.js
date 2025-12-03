import cloudinary from "../config/cloudinary.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const cloudinaryModeration = async (buffer) => {
  try {
    // Simpan buffer sementara karena Cloudinary perlu file fisik
    const tempFilename = `/tmp/${uuidv4()}.jpg`;
    fs.writeFileSync(tempFilename, buffer);

    const response = await cloudinary.uploader.upload(tempFilename, {
      moderation: "aws_rek", // AI moderation
      folder: "lostfound_temp",
    });

    // Hapus file sementara
    fs.unlinkSync(tempFilename);

    // Cloudinary memberikan hasil moderasi di field moderation
    if (
      response.moderation &&
      response.moderation.length > 0 &&
      response.moderation[0].status === "rejected"
    ) {
      return true; // foto ditolak AI
    }

    return false; // aman
  } catch (error) {
    console.error("Cloudinary moderation error:", error);
    return false; // jika AI error, jangan block semua
  }
};

export default cloudinaryModeration;