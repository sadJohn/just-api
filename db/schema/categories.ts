import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { postsTable } from "./posts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  posts: many(postsTable),
}));

export const categorySchema = createInsertSchema(categoriesTable);
export type CategorySchema = z.infer<typeof categorySchema>;
