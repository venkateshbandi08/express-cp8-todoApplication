const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API - 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
                SELECT * FROM todo
                WHERE
                priority = '${priority}' AND status = '${status}'
                AND todo LIKE '%${search_q}%';
            `;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE
                priority = '${priority}';
            `;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE
                status = '${status}';
            `;
      break;

    default:
      getTodosQuery = `
                SELECT * FROM todo
                WHERE
                todo LIKE '%${search_q}%';
            `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

// API - 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
        SELECT * FROM todo
        WHERE id = ${todoId};
    `;
  const todoIdObject = await db.get(getTodoIdQuery);
  response.send(todoIdObject);
});

// API - 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );
    `;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// API - 4

const keyIsStatus = (requestBody) => {
  return requestBody.status !== undefined;
};

const keyIsPriority = (requestBody) => {
  return requestBody.priority !== undefined;
};

const keyIsTodo = (requestBody) => {
  return requestBody.todo !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  let data = null;
  let putTodoQuery = "";
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;

  switch (true) {
    case keyIsStatus(request.body):
      putTodoQuery = `
                UPDATE todo
                SET 
                status = '${status}'
                WHERE id = ${todoId};
            `;
      data = "Status Updated";
      break;

    case keyIsPriority(request.body):
      putTodoQuery = `
                UPDATE todo
                SET
                priority = '${priority}'
                WHERE id = ${todoId};
            `;
      data = "Priority Updated";
      break;

    case keyIsTodo(request.body):
      putTodoQuery = `
                UPDATE todo
                SET
                todo = '${todo}'
                WHERE id = ${todoId};
            `;
      data = "Todo Updated";
      break;

    default:
      putTodoQuery = `
                UPDATE todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}';
            `;
  }
  await db.run(putTodoQuery);
  response.send(data);
});

// API - 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE
        id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
