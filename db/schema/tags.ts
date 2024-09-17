import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { postTagsTable } from "./postTags";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  posts: many(postTagsTable),
}));

export const tagSchema = createInsertSchema(tagsTable);
export type TagSchema = z.infer<typeof tagSchema>;
