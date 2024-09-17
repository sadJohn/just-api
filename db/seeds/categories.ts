import { categoriesTable } from "../schema";
import { DB } from "..";

const mock = [
  {
    name: "Node.js",
  },
  {
    name: "React",
  },
  {
    name: "Python",
  },
  {
    name: "Javascript",
  },
  {
    name: "Algorithms",
  },
  {
    name: "Devops",
  },
  {
    name: "APIs",
  },
];

export async function seed(db: DB) {
  await db.insert(categoriesTable).values(mock);
}
