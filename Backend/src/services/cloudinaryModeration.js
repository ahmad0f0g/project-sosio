import cloudinary from "../config/cloudinary.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import os from "os";  
import path from "path"; 

const cloudinaryModeration = async (buffer) => {
  try {
    const tempDir = os.tmpdir(); 
    
    const tempFilename = path.join(tempDir, `${uuidv4()}.jpg`);
    
    fs.writeFileSync(tempFilename, buffer);

    const response = await cloudinary.uploader.upload(tempFilename, {
      moderation: "aws_rek", 
      folder: "lostfound_temp",
    });

    fs.unlinkSync(tempFilename);

    if (
      response.moderation &&
      response.moderation.length > 0 &&
      response.moderation[0].status === "rejected"
    ) {
      console.log("[Security] Cloudinary AI rejected content (Adult/Gore/Etc).");
      await cloudinary.uploader.destroy(response.public_id);
      return true; 
    }

    return false;
  } catch (error) {
    console.error("Cloudinary moderation error:", error);
    return false; 
  }
};

export default cloudinaryModeration;