import { Hono } from "hono";
import { commentSchema, commentsTable, JwtPayload } from "../db/schema";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";
import { jwt } from "hono/jwt";
import { db } from "../db";

const commentsRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

commentsRouter.post(
  "/",
  zValidator("json", commentSchema, (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid comment data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  async (c) => {
    const body = c.req.valid("json");
    const comment = {
      ...body,
      parentId: body.parentId || null,
    };

    const newComment = (
      await db.insert(commentsTable).values(comment).returning()
    )[0];

    c.status(StatusCodes.CREATED);
    return c.json({ data: newComment });
  }
);

export default commentsRouter;
