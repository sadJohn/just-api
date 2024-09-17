import { faker } from "@faker-js/faker";
import { DB } from "..";
import { usersTable } from "../schema";

const mock = () => {
  const data = [];

  for (let i = 0; i < 20; i++) {
    data.push({
      username: faker.person.fullName(),
      password: faker.internet.password({ memorable: true, length: 4 }),
      age: faker.number.int({ min: 18, max: 99 }),
      email: faker.internet.email(),
    });
  }

  return data;
};

export async function seed(db: DB) {
  await db.insert(usersTable).values(mock());
}
