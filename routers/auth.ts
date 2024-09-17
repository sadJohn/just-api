import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { userSchema, usersTable } from "../db/schema";
import { StatusCodes } from "http-status-codes";
import * as bcrypt from "bcryptjs";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { genHashedPassword, genToken } from "../utils";

const authRouter = new Hono();

authRouter.post(
  "/register",
  zValidator("json", userSchema.options[0], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid user data!" });
    }
  }),
  async (c) => {
    const user = c.req.valid("json");

    user.password = await genHashedPassword(user.password);
    const newUsers = await db.insert(usersTable).values(user).returning({
      id: usersTable.id,
      username: usersTable.username,
      age: usersTable.age,
      email: usersTable.email,
      role: usersTable.role,
    });

    if (newUsers.length) {
      const newUser = newUsers[0];
      const token = genToken({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      });

      c.status(StatusCodes.CREATED);
      return c.json({ user: newUser, token });
    } else {
      c.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return c.json({ message: "Register failed!" });
    }
  }
);

authRouter.post(
  "/login",
  zValidator("json", userSchema.options[1], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid user data!" });
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (users.length) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = genToken({
          id: user.id,
          username: user.username,
          role: user.role,
        });

        return c.json({ user, token });
      } else {
        c.status(StatusCodes.UNAUTHORIZED);
        return c.json({ message: "Unauthenticated user!" });
      }
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

export default authRouter;
