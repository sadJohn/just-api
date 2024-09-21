import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { JwtPayload, userSchema, usersTable } from "../db/schema";
import { db } from "../db";
import { StatusCodes } from "http-status-codes";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getPaginationInfo,
  getTableCount,
  checkPermisson,
  adminGuard,
} from "../utils";

const usersRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

usersRouter.get("/", adminGuard, async (c) => {
  const { limit, offset } = getPaginationInfo(c.req.query());

  const users = await db.select().from(usersTable).limit(limit).offset(offset);

  const count = await getTableCount(usersTable);

  return c.json({ data: users, count });
});

usersRouter.get(
  "/:userId",
  zValidator("param", z.object({ userId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid userId!" });
    }
  }),
  async (c) => {
    const userId = Number(c.req.param("userId"));

    const hasPermisson = checkPermisson(c, userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!users.length) {
      c.status(StatusCodes.NOT_FOUND);
      return c.json({ message: "User not found!" });
    }

    return c.json({ data: users[0], message: "success" });
  }
);

usersRouter.put(
  "/:userId",
  zValidator("json", userSchema.options[2], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid user data!" });
    }
  }),
  zValidator("param", z.object({ userId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid userId!" });
    }
  }),
  async (c) => {
    const userId = Number(c.req.param("userId"));
    const user = c.req.valid("json");
    const payload = c.get("jwtPayload");

    let hasPermisson: boolean;
    if (user.role && user.role !== payload.role) {
      hasPermisson = checkPermisson(c);
    } else {
      hasPermisson = checkPermisson(c, userId);
    }
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const updatedUsers = await db
      .update(usersTable)
      .set({
        username: user.username,
        age: user.age,
        role: user.role,
      })
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        age: usersTable.age,
        email: usersTable.email,
        role: usersTable.role,
      });

    if (updatedUsers.length) {
      return c.json({ data: updatedUsers[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

usersRouter.delete(
  "/:userId",
  zValidator("param", z.object({ userId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid userId!" });
    }
  }),
  async (c) => {
    const userId = Number(c.req.param("userId"));

    const hasPermisson = checkPermisson(c, userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const deletedUsers = await db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    if (deletedUsers.length) {
      return c.json({ data: deletedUsers[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

export default usersRouter;
