import { PrismaClient } from "@prisma/client";
import { User } from "../model/User";

export class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async addUser(email: string): Promise<string> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return existingUser.id;
      }

      const newUser = await this.prisma.user.create({
        data: {
          email,
        },
      });

      return newUser.id;
    } catch (error) {
      throw new Error(`Error adding user: ${error.message}`);
    }
  }
}
