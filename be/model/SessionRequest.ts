import { Request } from "express";

export interface SessionRequest extends Request {
  session: {
    token: string;
    userInfo: {
      userId: string;
      sub: string;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      email: string;
      email_verified: boolean;
      locale: string;
    };
  };
}
