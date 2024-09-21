import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  commentsTable,
  JwtPayload,
  postSchema,
  postsTable,
  postTagsTable,
  SelectCommentModal,
} from "../db/schema";
import { db } from "../db";
import { StatusCodes } from "http-status-codes";
import { and, eq, notInArray, isNull, aliasedTable } from "drizzle-orm";
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

    const post = (
      await db.select().from(postsTable).where(eq(postsTable.id, postId))
    )[0];

    return c.json({ data: post, message: "success" });
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

    c.status(StatusCodes.CREATED);
    return c.json({ post: newPost });
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

    return c.json({ data: newPost, message: "success" });
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

    const deletedPost = (
      await db.delete(postsTable).where(eq(postsTable.id, postId)).returning()
    )[0];

    return c.json({ data: deletedPost, message: "success" });
  }
);

postsRouter.get("/:postId/comments/:commentId", async (c) => {
  const postId = Number(c.req.param("postId"));
  const commentId = Number(c.req.param("commentId"));
  const { limit, offset } = getPaginationInfo(c.req.query());

  const children = aliasedTable(commentsTable, "children");

  const sub = db
    .select()
    .from(commentsTable)
    .where(
      and(
        eq(commentsTable.postId, postId),
        eq(commentsTable.parentId, commentId)
      )
    )
    .limit(limit)
    .offset(offset)
    .as("comments");
  const comments = (await db
    .select()
    .from(sub)
    .leftJoin(children, eq(children.parentId, sub.id))) as {
    comments: SelectCommentModal;
    children?: SelectCommentModal;
  }[];

  const data = Object.values(
    comments.reduce<
      Record<number, { comments: SelectCommentModal; count: number }>
    >((acc, cur) => {
      const comments = cur.comments;
      const children = cur.children;

      if (!acc[comments.id]) {
        acc[comments.id] = { comments, count: 0 };
      }
      if (children) {
        acc[comments.id].count++;
      }
      return acc;
    }, {})
  );

  return c.json({ data, message: "success" });
});

postsRouter.get("/:postId/comments", async (c) => {
  const postId = Number(c.req.param("postId"));
  const { limit, offset } = getPaginationInfo(c.req.query());

  const children = aliasedTable(commentsTable, "children");

  const sub = db
    .select()
    .from(commentsTable)
    .where(
      and(eq(commentsTable.postId, postId), isNull(commentsTable.parentId))
    )
    .limit(limit)
    .offset(offset)
    .as("comments");
  const comments = (await db
    .select()
    .from(sub)
    .leftJoin(children, eq(children.parentId, sub.id))) as {
    comments: SelectCommentModal;
    children?: SelectCommentModal;
  }[];

  console.log("comments: ", comments);

  const data = Object.values(
    comments.reduce<
      Record<number, { comments: SelectCommentModal; count: number }>
    >((acc, cur) => {
      const comments = cur.comments;
      const children = cur.children;

      if (!acc[comments.id]) {
        acc[comments.id] = { comments, count: 0 };
      }
      if (children) {
        acc[comments.id].count++;
      }
      return acc;
    }, {})
  );

  return c.json({ data, message: "success" });
});

export default postsRouter;
