import axios from "axios";

class AuthService {
  private static _instance: AuthService;

  constructor() {
    if (!AuthService._instance) {
      AuthService._instance = this;
    }

    return AuthService._instance;
  }

  async validateToken(idToken: string) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${idToken}`,
      );
      return response.data;
    } catch (error) {
      throw new Error("Token validation failed");
    }
  }
}

export default AuthService;
