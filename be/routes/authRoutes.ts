import { OAuth2Client } from "google-auth-library";
import express from "express";
import { SessionRequest } from "../model/SessionRequest";
import verifyGoogleToken from "../middlewares/verifyGoogleToken";
import { PrismaClient } from "@prisma/client";
import { UserService } from "../services/UserService";

const router = express.Router();
const prisma = new PrismaClient();
const userService = new UserService(prisma);

router.post("/google", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");
  const redirectURL = "http://localhost:3000/auth/google/callback";
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
    const redirectURL = "http://localhost:3000/auth/google/callback";
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
    req.session.userInfo = userinfo;
    req.session.token = user.access_token;
    res.redirect("http://localhost:5173/loggedIn");
  } catch (err) {
    console.log(err);
  }
});

router.get("/token", async (req: SessionRequest, res) => {
  const token = req.session.token;

  if (token) {
    res.json({ token: token, userInfo: req.session.userInfo });
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
