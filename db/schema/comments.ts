import { InferSelectModel, relations } from "drizzle-orm";
import {
  AnyPgColumn,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: varchar("content", { length: 255 }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references(
    (): AnyPgColumn => commentsTable.id,
    { onDelete: "cascade" }
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
  post: one(postsTable, {
    fields: [commentsTable.postId],
    references: [postsTable.id],
  }),
}));

export const commentSchema = createInsertSchema(commentsTable, {
  postId: (schema) => schema.postId.min(1),
  userId: (schema) => schema.postId.min(1),
  content: (schema) => schema.content.min(1),
}).pick({
  userId: true,
  content: true,
  postId: true,
  parentId: true,
});
export type CommentSchema = z.infer<typeof commentSchema>;
export type SelectCommentModal = InferSelectModel<typeof commentsTable>;
