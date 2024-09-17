import { relations, InferSelectModel } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { postsTable } from "./posts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  USER_MODE_SIGNIN,
  USER_MODE_SIGNUP,
  USER_MODE_UPDATE,
} from "@/constants";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  age: integer("age").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
}));

const baseSchema = createInsertSchema(usersTable, {
  username: (schema) => schema.username.min(1),
  password: (schema) => schema.password.min(1),
  age: z.coerce.number().min(18).max(99),
  email: (schema) => schema.email.email(),
}).pick({
  username: true,
  password: true,
  age: true,
  email: true,
});

export const userSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal(USER_MODE_SIGNUP),
    username: baseSchema.shape.username,
    password: baseSchema.shape.password,
    email: baseSchema.shape.email,
    age: baseSchema.shape.age,
  }),
  z.object({
    mode: z.literal(USER_MODE_SIGNIN),
    password: baseSchema.shape.password,
    email: baseSchema.shape.email,
  }),
  z.object({
    mode: z.literal(USER_MODE_UPDATE),
    id: z.number().min(1),
    username: baseSchema.shape.username,
    age: baseSchema.shape.age,
  }),
]);
export type UserSchema = z.infer<typeof userSchema>;
export type SelectUserModal = InferSelectModel<typeof usersTable>;
