import { faker } from "@faker-js/faker";

import { DB } from "..";
import { tagsTable } from "../schema";

const mock = () => {
  const data = [];

  for (let i = 0; i < 10; i++) {
    data.push({
      name: faker.lorem.word({ length: 15 }),
    });
  }

  return data;
};

export async function seed(db: DB) {
  await db.insert(tagsTable).values(mock());
}
