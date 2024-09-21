import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { JwtPayload, SelectUserModal } from "./db/schema";
import { PSIZE_DEFAULT, ROLE } from "./constants";
import { db } from "./db";
import { count } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { Context, MiddlewareHandler, Next } from "hono";
import { StatusCodes } from "http-status-codes";

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

export const checkPermisson = (
  c: Context<{
    Variables: {
      jwtPayload: JwtPayload;
    };
  }>,
  id?: number
) => {
  const payload = c.get("jwtPayload");
  const hasPermisson = payload.role === ROLE.Admin || (id && id === payload.id);
  return !!hasPermisson;
};

export const adminGuard: MiddlewareHandler = async (
  c: Context<{
    Variables: {
      jwtPayload: JwtPayload;
    };
  }>,
  next: Next
) => {
  const payload = c.get("jwtPayload");
  const hasPermisson = payload.role === ROLE.Admin;
  if (!hasPermisson) {
    c.status(StatusCodes.UNAUTHORIZED);
    return c.json({ message: "No permisson!" });
  }
  await next();
};

export const getTableCount = async (table: PgTable) => {
  const counts = await db.select({ count: count() }).from(table);
  return counts[0].count;
};

const querySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  psize: z.coerce.number().min(0).optional(),
});

export const getPaginationInfo = (querys: Record<string, string>) => {
  const query = querySchema.safeParse(querys);
  const psize = query.data?.psize ?? PSIZE_DEFAULT;
  const page = query.data?.page ?? 1;
  return { limit: psize, offset: (page - 1) * psize };
};
