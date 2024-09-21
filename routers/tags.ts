import { Hono } from "hono";
import { JwtPayload, tagSchema, tagsTable } from "../db/schema";
import { db } from "../db";
import { getPaginationInfo, getTableCount, adminGuard } from "../utils";
import { jwt } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";
import { eq } from "drizzle-orm";
import { z } from "zod";

const tagsRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

tagsRouter.get("/", async (c) => {
  const { limit, offset } = getPaginationInfo(c.req.query());

  const tags = await db.select().from(tagsTable).limit(limit).offset(offset);
  const count = await getTableCount(tagsTable);

  return c.json({ data: tags, count });
});

tagsRouter.post(
  "/",
  zValidator("json", tagSchema.pick({ name: true }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid tag data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const tag = c.req.valid("json");

    const newTags = await db.insert(tagsTable).values(tag).returning();

    if (newTags.length) {
      const newTag = newTags[0];

      c.status(StatusCodes.CREATED);
      return c.json({ tag: newTag });
    } else {
      c.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return c.json({ message: "Create tags failed!" });
    }
  }
);

tagsRouter.put(
  "/:tagId",
  zValidator("json", tagSchema, (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid tag data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const tagId = Number(c.req.param("tagId"));

    const tag = c.req.valid("json");
    const updatedTags = await db
      .update(tagsTable)
      .set({ name: tag.name })
      .where(eq(tagsTable.id, tagId))
      .returning();

    if (updatedTags.length) {
      return c.json({ data: updatedTags[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Tag not found!" });
    }
  }
);

tagsRouter.delete(
  "/:tagId",
  zValidator("param", z.object({ tagId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid userId!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const tagId = Number(c.req.param("tagId"));

    const deletedTags = await db
      .delete(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .returning();

    if (deletedTags.length) {
      return c.json({ data: deletedTags[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

export default tagsRouter;
