import express from "express";
import { Request } from "express";

const router = express.Router();
import multer from "multer";
import { PhotoService } from "../services/PhotoService";
import { PrismaClient } from "@prisma/client";
import verifyGoogleToken from "../middlewares/verifyGoogleToken";

const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();
const photoService = new PhotoService(prisma);

interface PostPhotosRequest extends Request {
  files: File[];
  userId: string;
}

router.post(
  "/",
  verifyGoogleToken,
  upload.any("photos"),
  async (req: PostPhotosRequest, res) => {
    try {
      const uploadedFiles = req.files;
      const authToken = req.headers.authorization.split(" ")[1];
      await photoService.addPhotos(uploadedFiles, req.body.userId, authToken);
      res.status(200).send("Photos uploaded successfully");
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).send("Failed to upload photos");
    }
  },
);

router.get("/", verifyGoogleToken, async (req, res) => {
  try {
    const { userId, page, pageSize } = req.query;
    const photos = await photoService.getAll(
      userId as string,
      parseInt(page as string),
      parseInt(pageSize as string),
    );
    res.json(photos);
  } catch (error) {
    console.error("Error retrieving photos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trip", verifyGoogleToken, async (req, res) => {
  try {
    const { userId, page, pageSize, tripId } = req.query;
    const photos = await photoService.getAllByTrip(
      userId as string,
      parseInt(page as string),
      parseInt(pageSize as string),
      tripId as string,
    );
    res.json(photos);
  } catch (error) {
    console.error("Error retrieving photos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
