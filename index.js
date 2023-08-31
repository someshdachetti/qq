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
        user (username,name,password,gender,location)
        values (
            '${username}',
            '${name}',
            '${hashPassword}',
            '${gender}',
            '${location}'
        );`;
    try {
      await db.run(creatingNewUser);
      response.send("user successfully created");
    } catch (error) {
      console.error("error", error);
      response.send("intenal error").status(500);
    }
  } else {
    response.send("user already exist").status(400);
  }
});

// verifying user

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
  } else {
    try {
      const verifyPassword = await bcrypt.compare(password, dbUser.password);

      if (verifyPassword) {
        const payLoad = { username: username };

        console.log("payLoad", payLoad);

        const jtoken = await jwt.sign(payLoad, "websiteLearn");

        console.log("jtwt Token", jtoken);

        response.send({ jtoken });
      } else {
        response.send("Invalid user").status(400);
      }
    } catch (error) {
      console.error(("error occur", error));
      response.status(500).send("internal Error");
    }
  }
});
