import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";
import { relations, InferSelectModel } from "drizzle-orm";
import { postTagsTable } from "./postTags";
import { commentsTable } from "./comments";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { POST_MODE_CREATE, POST_MODE_EDIT } from "../../constants";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const postsRelations = relations(postsTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
  category: one(categoriesTable, {
    fields: [postsTable.categoryId],
    references: [categoriesTable.id],
  }),
  tags: many(postTagsTable),
  comments: many(commentsTable),
}));

const baseSchema = createInsertSchema(postsTable, {
  title: (schema) => schema.title.min(1),
  description: (schema) => schema.description.min(1).max(255),
  userId: (schema) => schema.userId.min(1),
  categoryId: (schema) => schema.categoryId.min(1),
}).pick({
  title: true,
  description: true,
  userId: true,
  categoryId: true,
  content: true,
});

export const postSchema = z.union([
  z.object({
    mode: z.literal(POST_MODE_CREATE),
    title: baseSchema.shape.title,
    description: baseSchema.shape.description,
    userId: baseSchema.shape.userId,
    categoryId: baseSchema.shape.categoryId,
    content: baseSchema.shape.content,
    tagIds: z.array(z.number()),
  }),
  z.object({
    mode: z.literal(POST_MODE_EDIT),
    id: z.number().min(1),
    title: baseSchema.shape.title,
    description: baseSchema.shape.description,
    userId: baseSchema.shape.userId,
    categoryId: baseSchema.shape.categoryId,
    content: baseSchema.shape.content,
    tagIds: z.array(z.number()),
  }),
]);
export type PostSchema = z.infer<typeof postSchema>;
export type SelectPostModal = InferSelectModel<typeof postsTable>;
