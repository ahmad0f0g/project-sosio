import express from "express";
import cors from "cors";
import language from "./middleware/language.js";
import errorHandler from "./middleware/errorHandler.js";

import reportRoutes from "./routes/reportRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(language);

app.use("/api/reports", reportRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
