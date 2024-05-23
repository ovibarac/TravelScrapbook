import AuthService from "../services/AuthService";
import { OAuth2Client } from "google-auth-library";

const authService = new AuthService();

const verifyGoogleToken = async (req, res, next) => {
  const client = new OAuth2Client(process.env.CLIENT_ID);
  const googleToken = req.headers.authorization ? req.headers.authorization.split(" ")[1] : undefined;

  if (!googleToken) {
    return res.status(401).send({
      success: false,
      error: "Unauthorized(No token)!",
    });
  }

  try {
    await authService.validateToken(googleToken);
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      error: "Unauthorized(Invalid token)!",
    });
  }
};

export default verifyGoogleToken;
