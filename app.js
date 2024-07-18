const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
var addDays = require("date-fns/addDays");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initilizeDbAndServer();

// API 1

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  return requestQuery.status && requestQuery.priority !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return requestQuery.status && requestQuery.category !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return requestQuery.priority && requestQuery.category !== undefined;
};

const isValidStatus = status => ["TO DO", "IN PROGRESS", "DONE"].includes(status)
const isValidPriority = priority => ["HIGH","MEDIUM","LOW"].includes(priority)
const isValidCategory = category => ["WORK", "HOME", "LEARNING"].includes(category)
const isValidDate = date => !isNaN(Date.parse(date))

app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { status, priority, category, search_q } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
        if (isValidStatus(status)){
            getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                status LIKE '${status}';
            `;
      const result1 = await db.all(getTodoQuery);
      response.send(result1);
        }else{
            response.status(400).send("Invalid Todo Status")
        }
      break;
    case hasPriorityProperty(request.query):
        if (isValidPriority(priority)){
             getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                priority LIKE '${priority}';
            `;
      const result2 = await db.all(getTodoQuery);
      response.send(result2);
        }else{
            response.status(400).send("Invalid Todo Priority")
        }     
      break;
    case hasCategoryProperty(request.query):
        if (isValidCategory(category)){
            getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                category LIKE '${category}';
            `;
      const result6 = await db.all(getTodoQuery);
      response.send(result6);
        }else{
            response.status(400).send("Invalid Todo Category")
        }
    break;
    case hasPriorityAndStatusProperty(request.query):
        if (isValidStatus(status) && isValidPriority(priority)){
            getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                priority LIKE '${priority}'
                AND status LIKE '${status}';
            `;
      const result3 = await db.all(getTodoQuery);
      response.send(result3);
        }else{
            response.status(400).send("Invalid status or priority")
        }      
      break;
    case hasSearchProperty(request.query):
      getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%';
            `;
      const result4 = await db.all(getTodoQuery);
      response.send(result4);
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                category LIKE '${category}'
                AND status LIKE '${status}';
            `;
      const result5 = await db.all(getTodoQuery);
      response.send(result5);
      break;
    
    case hasCategoryAndPriorityProperty(request.query):
      getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                category LIKE '${category}'
                AND priority LIKE '${priority}'
                ;
            `;
      const result7 = await db.all(getTodoQuery);
      response.send(result7);
        break
    default:
      response.send(400);
      break;
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date AS dueDate
            FROM 
                todo
            WHERE 
                id = ${todoId};
            `;
  const result = await db.get(getTodoQuery);
  response.send(result);
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateFormat = format(new Date(date),"yyyy-MM-dd")
  if(isValidDate(date)){
        console.log("valid date")
        const getTodoQuery = `
            SELECT
                id,
                todo, 
                category, 
                priority,
                status,
                due_date 
            FROM 
                todo
            WHERE 
                due_date = ${date};
            `;
  const result = await db.all(getTodoQuery);
  response.send(result);
  }else{
      response.status(400).send("Invalid Due Date")
  }
  
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (isValidStatus(status) && isValidPriority(priority) && isValidCategory(category) && isValidDate(dueDate)){
    const postTodoQuery = `
    INSERT INTO 
        todo(id, todo, category ,priority, status, due_date)
    VALUES 
        (
            ${id},
            '${todo}',
            '${category}',
            '${priority}',
            '${status}',
            '${dueDate}'
        ) ;
    `;
  const result = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
  }else{
    if (!isValidStatus(status)){
        response.status(400).send("Invalid Todo Status")
    }
    if(!isValidPriority(priority)){
        response.status(400).send("Invalid Todo Priority")
    }
    if(!isValidCategory(category)){
        response.status(400).send("Invalid Todo Category")

    }
    if(!isValidDate(dueDate)){
        response.status(400).send("Invalid Due Date")
    }
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status } = request.body;
  const { priority } = request.body;
  const { todo } = request.body;
  const { category } = request.body;
  const { dueDate } = request.body;
  let updateTodoQuery = "";
  switch (true) {
    case status !== undefined:
        if (!isValidStatus(status)){
            response.status(400).send("Invalid Todo Status")
        }else{
             updateTodoQuery = `
        UPDATE
            todo
        SET 
            status ='${status}'
        WHERE 
            id = ${todoId};
        `;
      const statusUpdate = await db.run(updateTodoQuery);
      response.send("Status Updated");
        }
      break;
    case priority !== undefined:
        if(!isValidPriority(priority)){
             response.status(400).send("Invalid Todo Priority")
        }else{
            updateTodoQuery = `
        UPDATE
            todo
        SET 
            priority ='${priority}'
        WHERE 
            id = ${todoId};
        `;
      const priorityUpdate = await db.run(updateTodoQuery);
      response.send("Priority Updated");
        }
      break;
    case todo !== undefined:
      updateTodoQuery = `
        UPDATE
            todo
        SET 
            todo ='${todo}'
        WHERE 
            id = ${todoId};
        `;
      const todoUpdate = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
        if(!isValidCategory(category)){
             response.status(400).send("Invalid Todo Category")
        }else{
            updateTodoQuery = `
        UPDATE
            todo
        SET 
            category ='${category}'
        WHERE 
            id = ${todoId};
        `;
      const categoryUpdate = await db.run(updateTodoQuery);
      response.send("Category Updated");
        }
      
      break;
    case dueDate !== undefined:
        if (isValidDate(dueDate)){
      updateTodoQuery = `
        UPDATE
            todo
        SET 
            due_date ='${dueDate}'
        WHERE 
            id = ${todoId};
        `;
      const dueDateUpdate = await db.run(updateTodoQuery);
      response.send("Due Date Updated");
        }else{
            response.status(400).send("Invalid Due Date")
        }
      break;

    default:
      response.status(400);
      break;
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE 
        id = ${todoId};
    `;
  const deletedTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
