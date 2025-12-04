const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  return res.status(500).json({
    message: err.message || "Terjadi kesalahan pada server.",
  });
};

export default errorHandler;
