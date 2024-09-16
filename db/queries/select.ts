import { db } from "../index";
import { SelectUser, usersTable } from "../schema";
export async function getUsers(): Promise<SelectUser[]> {
  return db.select().from(usersTable);
}
