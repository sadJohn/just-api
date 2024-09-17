import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { JwtPayload, userSchema, usersTable } from "../db/schema";
import { db } from "../db";
import { StatusCodes } from "http-status-codes";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { PSIZE_DEFAULT } from "../constants";
import { checkPermisson, getTableCount } from "../utils";

const usersRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  psize: z.coerce.number().min(0).optional(),
});

usersRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");

  const hasPermisson = checkPermisson(payload);
  if (!hasPermisson) {
    c.status(StatusCodes.UNAUTHORIZED);
    return c.json({ message: "No permisson!" });
  }

  const query = usersQuerySchema.safeParse(c.req.query());
  const psize = query.data?.psize ?? PSIZE_DEFAULT;
  const page = query.data?.page ?? 1;

  const users = await db
    .select()
    .from(usersTable)
    .limit(psize)
    .offset((page - 1) * psize);

  const count = await getTableCount(usersTable);

  return c.json({ users, count });
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
    const payload = c.get("jwtPayload");

    const hasPermisson = checkPermisson(payload);
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

    return c.json(users[0]);
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
    const payload = c.get("jwtPayload");

    const hasPermisson = checkPermisson(payload, userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

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
    const payload = c.get("jwtPayload");

    const hasPermisson = checkPermisson(payload);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

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
