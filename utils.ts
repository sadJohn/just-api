import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { JwtPayload, SelectUserModal } from "./db/schema";
import { ROLE } from "./constants";
import { db } from "./db";
import { count } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

export const genHashedPassword = async (
  password: SelectUserModal["password"]
) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const genToken = ({
  id,
  username,
  role,
}: Pick<SelectUserModal, "id" | "username" | "role">) =>
  jwt.sign({ id, username, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_LIFETIME!,
  });

export const checkPermisson = (jwtPayload: JwtPayload, id?: number) => {
  return jwtPayload.role === ROLE.Admin || (id && id === jwtPayload.id);
};

export const getTableCount = async (table: PgTable) => {
  const counts = await db.select({ count: count() }).from(table);
  return counts[0].count;
};
