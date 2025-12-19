import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// importing routes ...
import authRoute from "./routes/auth/userAuth.routes.js";
import chatRoutes from "./routes/chat/message.routes.js";

app.use("/api/auth", authRoute);
app.use("/api/message",chatRoutes);

export default app;
