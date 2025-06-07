import { PrismaClient } from "@prisma/client";
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import verifyGoogleToken from "./middlewares/verifyGoogleToken";
import authRoutes from "./routes/authRoutes";
import photoRoutes from "./routes/photoRoutes";
import bodyParser from "body-parser";
import https from "https";
import fs from "fs";
import RedisStoreLib from "connect-redis";



const prisma = new PrismaClient();

dotenv.config();
const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.use(
  session({
    secret: "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",
    resave: true,
    cookie: { secure: false }, //false for http
    saveUninitialized: true,
  }),
);
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      process.env.SERVER_URL,
    ],
    credentials: true,
  }),
);
app.use(bodyParser.json());

app.get("/api/restricted", verifyGoogleToken, (req, res) => {
  res.json({
    message: "Access granted!",
  });
});

app.use("/auth", authRoutes);
app.use("/photos", photoRoutes);


const httpsOptions = {
  key: fs.readFileSync('/home/ec2-user/ssl/key.pem'),
  cert: fs.readFileSync('/home/ec2-user/ssl/cert.pem'),
};
const PORT = process.env.PORT || 3000;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
