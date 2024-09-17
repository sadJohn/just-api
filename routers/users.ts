import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchema, usersTable } from "../db/schema";
import { db } from "../db";
import { StatusCodes } from "http-status-codes";
import * as bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { PSIZE_DEFAULT } from "../constants";

const usersRouter = new Hono();

const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  psize: z.coerce.number().min(0).optional(),
});

usersRouter.get("/", async (c) => {
  const query = usersQuerySchema.safeParse(c.req.query());
  const psize = query.data?.psize ?? PSIZE_DEFAULT;
  const page = query.data?.page ? query.data?.page - 1 : 0;
  const users = await db.select().from(usersTable).limit(psize).offset(page);
  return c.json(users);
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

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!users.length) {
      c.status(StatusCodes.NOT_FOUND);
      return c.json({ message: "User not found!" });
    }

    return c.json(users[0]);
  }
);

usersRouter.post(
  "/",
  zValidator("json", userSchema.options[0], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid user data!" });
    }
  }),
  async (c) => {
    const user = c.req.valid("json");

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    const newUser = await db.insert(usersTable).values(user).returning({
      userId: usersTable.id,
      username: usersTable.username,
      age: usersTable.age,
      email: usersTable.email,
    });
    c.status(StatusCodes.CREATED);
    return c.json(newUser);
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
    const updatedUser = await db
      .update(usersTable)
      .set({ username: user.username, age: user.age })
      .where(eq(usersTable.id, userId))
      .returning({
        userId: usersTable.id,
        username: usersTable.username,
        age: usersTable.age,
        email: usersTable.email,
      });

    if (updatedUser.length) {
      return c.json({ message: "success" });
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

    const deletedUsers = await db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    if (deletedUsers.length) {
      return c.json({ message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

export default usersRouter;
