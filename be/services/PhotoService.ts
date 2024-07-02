import { PrismaClient } from "@prisma/client";
import { drive_v3, google } from "googleapis";
import { Readable } from "stream";
import dobbyscan from "dobbyscan";
import geocluster from "geocluster";
import dbscan from "@cdxoo/dbscan";

import ExifParser from "exif-parser";
import { Photo } from "../model/Photo";
import * as cluster from "cluster";

interface BufferedFile extends File {
  buffer: Buffer;
}

export class PhotoService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async addPhotos(files, userId: string, authToken: string) {
    const oAuth2Client = new google.auth.OAuth2({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: `${process.env.SERVER_URL}:3000/auth/google/callback`,
    });
    oAuth2Client.setCredentials({
      access_token: authToken,
    });

    const photoList: Photo[] = [];
    const drive = google.drive({
      version: "v3",
      auth: oAuth2Client,
    });

    const folderName = "TravelScrapbook";
    const folderId = await this.createOrUpdateFolder(drive, folderName);

    try {
      for (const file of files) {
        const metadata = ExifParser.create(file.buffer).parse();
        const photoData: Photo = {
          name: file.originalname,
          date: new Date(metadata.tags.DateTimeOriginal * 1000),
          userId,
          url: "",
          latitude: metadata.tags.GPSLatitude,
          longitude: metadata.tags.GPSLongitude,
        };
        const webContentLink = await this.uploadToDrive(file, drive, folderId);
        const id = this.extractFileId(webContentLink);
        photoData.url = `https://drive.google.com/thumbnail?id=${id}&sz=w${metadata.imageSize.width}`;
        photoList.push(photoData);
      }

      console.log("Upload successful");

      const dataPoints = photoList.filter(
        (photo) => photo.latitude && photo.longitude,
      );

      let objectResult = dbscan({
        dataset: dataPoints,
        epsilon: 10,
        distanceFunction: (a, b) =>
          this.calculateDistance(
            a.latitude,
            a.longitude,
            b.latitude,
            b.longitude,
          ),
      });
      const clusters = objectResult.clusters.map((cluster) =>
        cluster.map((i) => dataPoints[i]),
      );

      console.log("Clustering successful. No of clusters: " + clusters.length);

      let photos = [];

      for (const cluster of clusters) {
        const startDate = cluster.reduce((accumulator, current) =>
          accumulator.date > current.date ? current : accumulator,
        ).date;
        const endDate = cluster.reduce((accumulator, current) =>
          accumulator.date < current.date ? current : accumulator,
        ).date;

        const createdTrip = await this.prisma.trip.create({
          data: {
            name: "",
            startDate: startDate,
            endDate: endDate,
            userId: userId,
          },
        });

        console.log("Trip created with id " + createdTrip.id);
        const newCluster = cluster.map((photo: Photo) => {
          return { ...photo, tripId: createdTrip.id };
        });

        photos = [...photos, ...newCluster];
      }
      photos = [
        ...photos,
        ...photoList.filter(
          (photo) =>
            !photos.find(
              (clusteredPhoto) => photo.name === clusteredPhoto.name,
            ),
        ),
      ];
      console.log('Photos to upload: ')
      console.log(photos.map(photo => photo.name));

      const createdPhotos = await this.prisma.photo.createMany({
        data: photos,
      });

      console.log("Uploaded photos:", createdPhotos);
    } catch (error) {
      console.log(error);
    }
  }

  deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private async uploadToDrive(file, drive, folderId: string) {
    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: media,
      fields: "id, webViewLink, webContentLink",
    });

    return response.data.webContentLink;
  }

  private async createOrUpdateFolder(
    drive: drive_v3.Drive,
    folderName: string,
  ) {
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
    });
    let folderId: string;
    if (response.data.files.length > 0) {
      folderId = response.data.files[0].id;
      console.log(`Folder '${folderName}' already exists with ID: ${folderId}`);

      const permissionsResponse = await drive.permissions.list({
        fileId: folderId,
      });

      const permissions = permissionsResponse.data.permissions;

      const hasCorrectPermission = permissions.some((permission) => {
        return permission.type === "anyone" && permission.role === "reader";
      });

      if (!hasCorrectPermission) {
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });

        console.log(`Updated permissions for folder '${folderName}'`);
      }
    } else {
      const createFolderResponse = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          permissions: [
            {
              type: "anyone",
              role: "reader",
            },
          ],
        },
        fields: "id",
      });

      folderId = createFolderResponse.data.id;
      console.log(`Created folder '${folderName}' with ID: ${folderId}`);
    }

    return folderId;
  }

  extractFileId(url) {
    const regex =
      /(?:\/(?:file\/d\/|open\?id=|uc\?id=))(.*?)(?:\/|$|\?|#|&export)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }

  async getAll(userId: string, page: number, pageSize: number) {
    const photosGroupedByDate = await this.prisma.$queryRaw`
      SELECT date_trunc('day', date) AS date, json_agg(p ORDER BY date DESC) AS photos
      FROM "Photo" p
      WHERE "userId" = ${userId} 
      GROUP BY date_trunc('day', date)
      ORDER BY date_trunc('day', date) DESC
    `;

    return photosGroupedByDate;
  }

  async editCaption(
    userId: string,
    photoId: string,
    caption: string,
    description: string,
  ) {
    const updatedPhoto = await this.prisma.photo.update({
      where: { id: photoId, userId },
      data: {
        caption,
        description,
      },
    });

    return updatedPhoto;
  }

  async getAllByTrip(
    userId: string,
    page: number,
    pageSize: number,
    tripId: string,
  ) {
    const photosGroupedByDate = await this.prisma.$queryRaw`
      SELECT date_trunc('day', date) AS date, json_agg(p ORDER BY date DESC) AS photos
      FROM "Photo" p
      WHERE "userId" = ${userId} AND "tripId" = ${tripId}
      GROUP BY date_trunc('day', date)
      ORDER BY date_trunc('day', date) DESC
    `;
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });

    return { photos: photosGroupedByDate, trip };
  }

  async getAllTrips(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const trips = await this.prisma.trip.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    });

    return trips;
  }

  async editTrip(userId: string, tripId: string, name: string) {
    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId, userId },
      data: {
        name,
      },
    });

    return updatedTrip;
  }
}
