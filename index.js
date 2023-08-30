const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

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

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//login user

app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `select * from user where username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //creating new user
    const creatingNewUser = `
        INSERT INTO 
        user (username,name,gender,location)
        values (
            '${username}',
            '${name}',
            '${hashPassword}',
            '${gender}',
            '${location}'
        );`;
  } else {
    response.status(400);
    response.send("user Already Exist");
  }
});

// verifying user

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.send(400);
  } else {
    const verifyPassword = await bcrypt.compare(password, dbUser.password);
    if (verifyPassword === true) {
      const payload = { username: username };

      const jtoken = jwt.sing(payload, "websiteLearn");

      response.send({ jtoken });
    } else {
      response.status(400);
      response.send("Invalid User");
    }
  }
});
