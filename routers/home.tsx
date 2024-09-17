import { API_VERSION } from "@/constants";
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
      ["getUsers", "GET", `/api/${API_VERSION}/users`],
      ["getUser", "GET", `/api/${API_VERSION}/users/:userId`],
      ["createUser", "POST", `/api/${API_VERSION}/users`],
      ["updateUser", "PUT", `/api/${API_VERSION}/users/:userId`],
      ["deleteUser", "DELETE", `/api/${API_VERSION}/users/:userId`],
    ],
  },
  {
    name: "Categories",
    table: categoriesRelations.table,
    apis: [
      ["getCategories", "GET", `/api/${API_VERSION}/categories`],
      ["getCategorie", "GET", `/api/${API_VERSION}/categories/:categoryId`],
      ["createCategorie", "POST", `/api/${API_VERSION}/categories`],
      ["updateCategorie", "PUT", `/api/${API_VERSION}/categories/:categoryId`],
      [
        "deleteCategorie",
        "DELETE",
        `/api/${API_VERSION}/categories/:categoryId`,
      ],
    ],
  },
  {
    name: "Posts",
    table: postsRelations.table,
    apis: [
      ["getPosts", "GET", `/api/${API_VERSION}/posts`],
      ["getPost", "GET", `/api/${API_VERSION}/posts/:postId`],
      ["createPost", "POST", `/api/${API_VERSION}/posts`],
      ["updatePost", "PUT", `/api/${API_VERSION}/posts/:postId`],
      ["deletePost", "DELETE", `/api/${API_VERSION}/posts/:postId`],
    ],
  },
  {
    name: "Comments",
    table: commentsRelations.table,
    apis: [
      ["getComments", "GET", `/api/${API_VERSION}/comments`],
      ["getComment", "GET", `/api/${API_VERSION}/comments/:commentId`],
      ["createComment", "POST", `/api/${API_VERSION}/comments`],
      ["updateComment", "PUT", `/api/${API_VERSION}/comments/:commentId`],
      ["deleteComment", "DELETE", `/api/${API_VERSION}/comments/:commentId`],
    ],
  },
  {
    name: "Tags",
    table: tagsRelations.table,
    apis: [
      ["getTags", "GET", `/api/${API_VERSION}/tags`],
      ["getTag", "GET", `/api/${API_VERSION}/tags/:tagId`],
      ["createTag", "POST", `/api/${API_VERSION}/tags`],
      ["updateTag", "PUT", `/api/${API_VERSION}/tags/:tagId`],
      ["deleteTag", "DELETE", `/api/${API_VERSION}/tags/:tagId`],
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
