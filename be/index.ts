import { PrismaClient } from "@prisma/client";
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import verifyGoogleToken from './middlewares/verifyGoogleToken'
import authRoutes from "./routes/authRoutes";
import photoRoutes from "./routes/photoRoutes";
import bodyParser from "body-parser";

const prisma = new PrismaClient();

dotenv.config();
const app = express();

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.use(
  session({
    secret: "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",
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(bodyParser.json());

// app.post('/photo', async (req, res) => {
//   try {
//     const { data } = req.body;
//     const result = await prisma.data.create({
//       data: {
//         value: data,
//       },
//     });
//     res.json({ message: 'Data stored successfully', data: result });
//   } catch (error) {
//     console.error('Error storing data:', error);
//     res.status(500).json({ error: 'Failed to store data' });
//   }
// });
//
app.get("/api/restricted", verifyGoogleToken, (req, res) => {
  res.json({
    message: "Access granted!",
  });
});

// app.get("/", (req, res) => {
//   res.send(req.session.token);
// });

app.use("/auth", authRoutes);
app.use("/photos", photoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
