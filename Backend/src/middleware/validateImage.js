import cloudinaryModeration from "../services/cloudinaryModeration.js";

const validateImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      return next();

    next();
    
  } catch (error) {
    console.error("Image validation error:", error);
    next(); 
  }
};

export default validateImage;