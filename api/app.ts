import { Hono } from "hono";
import { getUsers } from "../db/queries/select";

const app = new Hono().basePath("/api");

app.get("/", async (c) => {
  const users = await getUsers();
  return c.json(users);
});

export default app