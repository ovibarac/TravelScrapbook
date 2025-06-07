import { OAuth2Client } from "google-auth-library";
import express from "express";
import { SessionRequest } from "../model/SessionRequest";
import verifyGoogleToken from "../middlewares/verifyGoogleToken";
import { PrismaClient } from "@prisma/client";
import { UserService } from "../services/UserService";
import fs from "fs";

const dataFilePath = '/home/ec2-user/be/data.json';
function readDataFromFile() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data file:', err);
    return {};
  }
}

function writeDataToFile(data: any) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

const router = express.Router();
const prisma = new PrismaClient();
const userService = new UserService(prisma);

router.post("/google", async (req, res) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.header("Referrer-Policy", "no-referrer-when-downgrade");
  const redirectURL = `${process.env.SERVER_URL}:3000/auth/google/callback`;
  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectURL,
  );

  const authorizeURL = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile " +
      "https://www.googleapis.com/auth/userinfo.email " +
      "openid " +
      "https://www.googleapis.com/auth/drive " +
      "https://www.googleapis.com/auth/drive.metadata " +
      "https://www.googleapis.com/auth/drive.photos.readonly " +
      "https://www.googleapis.com/auth/drive.install ",
    prompt: "consent",
  });

  res.json({ url: authorizeURL });
});

const getUserData = async (access_token) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
  );

  return await response.json();
};

router.get("/google/callback", async (req: SessionRequest, res) => {
  const code = req.query.code as string;
  try {
    const redirectURL = `${process.env.SERVER_URL}:3000/auth/google/callback`;
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL,
    );
    const authRes = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(authRes.tokens);
    console.log("Tokens acquired");
    const user = oAuth2Client.credentials;
    console.log("credentials", user);
    const userinfo = await getUserData(user.access_token);
    console.log("userinfo: ", userinfo);

    const userId = await userService.addUser(userinfo.email);

    userinfo.userId = userId;
    let data = { userInfo: userinfo, token: user.access_token };
    writeDataToFile(data);//
    res.redirect(`${process.env.CLIENT_URL}/loggedIn`);
  } catch (err) {
    console.log(err);
  }
});

router.get("/token", async (req: SessionRequest, res) => {
  const data = readDataFromFile();
  const token = data.token;
  const userInfo = data.userInfo;

  if (token) {
    res.json({ token, userInfo });
  } else {
    res.status(500).send("Token not found");
  }
});

router.post("/validateToken", verifyGoogleToken, (req, res) => {
  console.log("Valid token");
  res.json({
    isValid: true,
  });
});

export default router;
