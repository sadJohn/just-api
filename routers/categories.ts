import { Hono } from "hono";
import { categoriesTable, JwtPayload, categorySchema } from "../db/schema";
import { db } from "../db";
import { getPaginationInfo, getTableCount, adminGuard } from "../utils";
import { zValidator } from "@hono/zod-validator";
import { StatusCodes } from "http-status-codes";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { jwt } from "hono/jwt";

const categoriesRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

categoriesRouter.get("/", async (c) => {
  const { limit, offset } = getPaginationInfo(c.req.query());

  const categories = await db
    .select()
    .from(categoriesTable)
    .limit(limit)
    .offset(offset);
  const count = await getTableCount(categoriesTable);

  return c.json({ data: categories, count });
});

categoriesRouter.post(
  "/",
  zValidator("json", categorySchema.pick({ name: true }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid category data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const category = c.req.valid("json");

    const newCategory = (
      await db.insert(categoriesTable).values(category).returning()
    )[0];

    c.status(StatusCodes.CREATED);
    return c.json({ data: newCategory });
  }
);

categoriesRouter.put(
  "/:categoryId",
  zValidator("json", categorySchema, (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid category data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const categoryId = Number(c.req.param("categoryId"));

    const category = c.req.valid("json");
    const updatedCategory = (
      await db
        .update(categoriesTable)
        .set({ name: category.name })
        .where(eq(categoriesTable.id, categoryId))
        .returning()
    )[0];

    return c.json({ data: updatedCategory, message: "success" });
  }
);

categoriesRouter.delete(
  "/:categoryId",
  zValidator(
    "param",
    z.object({ categoryId: z.coerce.number() }),
    (result, c) => {
      if (!result.success) {
        c.status(StatusCodes.BAD_REQUEST);
        return c.json({ message: "Invalid userId!" });
      }
    }
  ),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  adminGuard,
  async (c) => {
    const categoryId = Number(c.req.param("categoryId"));

    const deletedTag = (
      await db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, categoryId))
        .returning()
    )[0];

    return c.json({ data: deletedTag, message: "success" });
  }
);

export default categoriesRouter;
