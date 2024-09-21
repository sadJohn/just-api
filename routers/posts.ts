import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  JwtPayload,
  postSchema,
  postsTable,
  postTagsTable,
} from "../db/schema";
import { db } from "../db";
import { StatusCodes } from "http-status-codes";
import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { getPaginationInfo, getTableCount, checkPermisson } from "../utils";
import { jwt } from "hono/jwt";

const postsRouter = new Hono<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>();

postsRouter.get("/", async (c) => {
  const { limit, offset } = getPaginationInfo(c.req.query());

  const posts = await db.select().from(postsTable).limit(limit).offset(offset);

  const count = await getTableCount(postsTable);

  return c.json({ data: posts, count });
});

postsRouter.get(
  "/:postId",
  zValidator("param", z.object({ postId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid postId!" });
    }
  }),
  async (c) => {
    const postId = Number(c.req.param("postId"));

    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId));

    if (!posts.length) {
      c.status(StatusCodes.NOT_FOUND);
      return c.json({ message: "Post not found!" });
    }

    return c.json({ data: posts[0], message: "success" });
  }
);

postsRouter.post(
  "/",
  zValidator("json", postSchema.options[0], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid user data!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  async (c) => {
    const post = c.req.valid("json");

    const hasPermisson = checkPermisson(c, post.userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const newPost = await db.transaction(async (tx) => {
      const newPosts = await tx.insert(postsTable).values(post).returning();
      await tx
        .insert(postTagsTable)
        .values(
          post.tagIds.map((tagId) => ({ postId: newPosts[0].id, tagId }))
        );
      return { ...newPosts[0], tagIds: post.tagIds };
    });

    if (newPost) {
      c.status(StatusCodes.CREATED);
      return c.json({ post: newPost });
    } else {
      c.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return c.json({ message: "Create post failed!" });
    }
  }
);

postsRouter.put(
  "/:postId",
  zValidator("json", postSchema.options[1], (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid post data!" });
    }
  }),
  zValidator("param", z.object({ postId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid postId!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  async (c) => {
    const post = c.req.valid("json");

    const hasPermisson = checkPermisson(c, post.userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const postId = Number(c.req.param("postId"));

    const newPost = await db.transaction(async (tx) => {
      const updatedPosts = await tx
        .update(postsTable)
        .set({
          title: post.title,
          content: post.content,
          categoryId: post.categoryId,
          description: post.description,
        })
        .where(eq(postsTable.id, postId))
        .returning();
      await tx
        .insert(postTagsTable)
        .values(
          post.tagIds.map((tagId) => ({ postId: updatedPosts[0].id, tagId }))
        )
        .onConflictDoNothing();
      await tx
        .delete(postTagsTable)
        .where(
          and(
            eq(postTagsTable.postId, post.id),
            notInArray(postTagsTable.tagId, post.tagIds)
          )
        );

      return { ...updatedPosts[0], tagIds: post.tagIds };
    });

    if (newPost) {
      return c.json({ data: newPost, message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "User not found!" });
    }
  }
);

postsRouter.delete(
  "/:postId",
  zValidator("param", z.object({ postId: z.coerce.number() }), (result, c) => {
    if (!result.success) {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Invalid postId!" });
    }
  }),
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
  async (c) => {
    const postId = Number(c.req.param("postId"));

    const post = (
      await db
        .select({ userId: postsTable.userId })
        .from(postsTable)
        .where(eq(postsTable.id, postId))
    )[0];
    const hasPermisson = checkPermisson(c, post.userId);
    if (!hasPermisson) {
      c.status(StatusCodes.UNAUTHORIZED);
      return c.json({ message: "No permisson!" });
    }

    const deletedPosts = await db
      .delete(postsTable)
      .where(eq(postsTable.id, postId))
      .returning();

    if (deletedPosts.length) {
      return c.json({ data: deletedPosts[0], message: "success" });
    } else {
      c.status(StatusCodes.BAD_REQUEST);
      return c.json({ message: "Delete post failed!" });
    }
  }
);

export default postsRouter;
