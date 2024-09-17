import { faker } from "@faker-js/faker";
import { DB,db } from "..";
import { categoriesTable, postsTable, usersTable } from "../schema";

const mock = async () => {
  const [usersData, categoriesData] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(categoriesTable),
  ]);

  const data = [];

  for (let i = 0; i < 100; i++) {
    data.push({
      title: faker.lorem.words(),
      content: faker.lorem.paragraphs(20, "<br/><br/>"),
      userId: faker.helpers.arrayElement(usersData).id,
      description: faker.lorem.sentence({ min: 3, max: 10 }),
      categoryId: faker.helpers.arrayElement(categoriesData).id,
    });
  }

  return data;
};

export async function seed(db: DB) {
  const insertData = await mock();
  await db.insert(postsTable).values(insertData);
}
