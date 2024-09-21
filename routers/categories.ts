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

    const newCategories = await db
      .insert(categoriesTable)
      .values(category)
      .returning();

    if (newCategories.length) {
      const newCategory = newCategories[0];

      c.status(StatusCodes.CREATED);
      return c.json({ category: newCategory });
    } else {
      c.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return c.json({ message: "Create category failed!" });
    }
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
    const updatedCategories = await db
      .update(categoriesTable)
      .set({ name: category.name })
      .where(eq(categoriesTable.id, categoryId))
      .returning();

    if (updatedCategories.length) {
      return c.json({ data: updatedCategories[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Category not found!" });
    }
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

    const deletedTags = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .returning();

    if (deletedTags.length) {
      return c.json({ data: deletedTags[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

export default categoriesRouter;
