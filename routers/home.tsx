import {
  categoriesRelations,
  commentsRelations,
  postsRelations,
  tagsRelations,
  usersRelations,
} from "@/db/schema";
import { Hono } from "hono";
import { FC } from "hono/jsx";

const homeRouter = new Hono();

const relations = [
  {
    name: "Users",
    table: usersRelations.table,
    apis: [
      ["getUsers", "GET", "/users"],
      ["getUser", "GET", "/users/:userId"],
      ["createUser", "POST", "/users"],
      ["updateUser", "PUT", "/users/:userId"],
      ["deleteUser", "DELETE", "/users/:userId"],
    ],
  },
  {
    name: "Categories",
    table: categoriesRelations.table,
    apis: [
      ["getCategories", "GET", "/categories"],
      ["getCategorie", "GET", "/categories/:categoryId"],
      ["createCategorie", "POST", "/categories"],
      ["updateCategorie", "PUT", "/categories/:categoryId"],
      ["deleteCategorie", "DELETE", "/categories/:categoryId"],
    ],
  },
  {
    name: "Posts",
    table: postsRelations.table,
    apis: [
      ["getPosts", "GET", "/posts"],
      ["getPost", "GET", "/posts/:postId"],
      ["createPost", "POST", "/posts"],
      ["updatePost", "PUT", "/posts/:postId"],
      ["deletePost", "DELETE", "/posts/:postId"],
    ],
  },
  {
    name: "Comments",
    table: commentsRelations.table,
    apis: [
      ["getComments", "GET", "/comments"],
      ["getComment", "GET", "/comments/:commentId"],
      ["createComment", "POST", "/comments"],
      ["updateComment", "PUT", "/comments/:commentId"],
      ["deleteComment", "DELETE", "/comments/:commentId"],
    ],
  },
  {
    name: "Tags",
    table: tagsRelations.table,
    apis: [
      ["getTags", "GET", "/tags"],
      ["getTag", "GET", "/tags/:tagId"],
      ["createTag", "POST", "/tags"],
      ["updateTag", "PUT", "/tags/:tagId"],
      ["deleteTag", "DELETE", "/tags/:tagId"],
    ],
  },
];

const Home: FC = () => {
  return (
    <html>
      <body>
        <div style={{ margin: "0 auto", width: "70vw" }}>
          <h1 style={{ marginTop: "50px" }}>Just Api</h1>
          {relations.map((item) => {
            return (
              <div key={item.name}>
                <h2>{item.name}</h2>
                <div style={{ display: "flex" }}>
                  {Object.keys(item.table).map((title, index) => {
                    return (
                      <div
                        key={title}
                        style={{
                          padding: "5px 20px",
                          border: "1px solid black",
                          ...(index && { borderLeft: "none" }),
                        }}
                      >
                        {title}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", marginTop: "10px" }}>
                  <div style={{ marginRight: "20px" }}>
                    {item.apis.map((i) => (
                      <div>{i[0]}</div>
                    ))}
                  </div>
                  <div style={{ marginRight: "20px" }}>
                    {item.apis.map((i) => (
                      <div>
                        <i>{i[1]}</i>
                      </div>
                    ))}
                  </div>
                  <div>
                    {item.apis.map((i) => (
                      <div>{i[2]}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </body>
    </html>
  );
};

homeRouter.get("/", (c) => {
  return c.html(<Home />);
});

export default homeRouter;
