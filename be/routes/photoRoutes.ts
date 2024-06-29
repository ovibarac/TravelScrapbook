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

router.post("/caption", verifyGoogleToken, async (req, res) => {
  try {
    const { userId, photoId, caption, description } = req.body;
    const photo = await photoService.editCaption(
      userId,
      photoId,
      caption,
      description,
    );
    res.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
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
    console.log(photos)
    res.json(photos);
  } catch (error) {
    console.error("Error retrieving photos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/trip", verifyGoogleToken, async (req, res) => {
  try {
    const { userId, name, tripId } = req.body;
    const trip = await photoService.editTrip(
      userId as string,
      tripId as string,
      name as string,
    );
    res.json(trip);
  } catch (error) {
    console.error("Error editing trip:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trips", verifyGoogleToken, async (req, res) => {
  try {
    const { userId, page, pageSize } = req.query;
    const trips = await photoService.getAllTrips(
      userId as string,
      parseInt(page as string),
      parseInt(pageSize as string),
    );
    res.json(trips);
  } catch (error) {
    console.error("Error retrieving trips:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
