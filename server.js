//load .env file into process.env
//This keeps values such as database credentials
//and the session secret outside of the source code
require("dotenv").config();

//Express is used the create the web server and api routes
const express = require("express");

//mysql12 allows node.js to communicate with the msql database
const mysql = require("mysql2");

//Cors controls whether requests from other origins are allowed
const cors = require("cors");

//express-session is used to keep users logged in between requests
const session = require("express-session");

//used to securely store hash passwords before storing them and compare passwords
//during login
const bcrypt = require("bcrypt");

//Create the express application
const app = express();

//Allows cross-origin requests
app.use(cors());

//Used the convert json request bodies into javascript objects available through req.body
app.use(express.json());

//Serve frontend files such as html, css and javascript files from the public folder
app.use(express.static("public"));


app.use(session({

  // Secret used to sign the session cookie.
  // The value comes from .env, with a development fallback
  secret: process.env.SESSION_SECRET || "dev-secret",

  // Do not save the session again if nothing has changed
  resave: false,

  // Do not create an empty session for users who
  // have not logged in
  saveUninitialized: false
}));

//create a connection to the jobtracker mysql database
//using the credentials stored in the env.file
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

//Attempt to connect to mysql when the server starts
db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

//protects routes that should only be accessible to the logged-in user
function requireLogin(req, res, next) {

  //A logged-in user should have a userid stored inside their session
  if(!req.session || !req.session.userID){
    return res.status(401).json({
      message : "Please log in first"
    });
  }

  //Allows express to continue to the requested route
  next();
}

//route to confirm that the API is running
app.get("/", (req, res) => {
  res.send("JobTracker API is running!");
});

// GET all applications belonging to the user
app.get("/ApplicationsTable", requireLogin, (req, res) => {

  //get the logged-in users id from their session
  const userID = req.session.userID;

  //Query to select all applications belonging to the user
  const sql = `
    SELECT * FROM ApplicationsTable
    WHERE userID = ?
  `;

  //pass the userid separately so mysql2 sately inserts it into the ? placeholder
  db.query(sql, [userID], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }
    
    //send the users application back as json
    res.json(results);
  });
});

// CREATE application for user currently logged in
app.post("/ApplicationsTable", requireLogin, (req, res) => {
  const userID = req.session.userID; //Get the logged-in users ID from the session

  //get the application details sent by the dashboard
  const {
    company,
    role_title,
    status,
    date_applied,
    notes
  } = req.body; //get the application details sent by the dashboard form

  //sql query to create the new application
  const sql = `
    INSERT INTO ApplicationsTable
    (userID, company, role_title, status, date_applied, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  //Query execution using the parameter placeholders
  db.query(
    sql,
    [userID, company, role_title, status, date_applied, notes],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      //201 means that a new resource was successfully added
      res.status(201).json({
        message: "Application added successfully",

        //mysql returns the automatically generated application
        //through insertId
        id: result.insertId
      });
    }
  );
});

// UPDATE an application belonging to the user
app.put("/ApplicationsTable/:id", requireLogin, (req, res) => {

  //get the application id from the url
  //Example: /Application/6 gives id = 6
  const id = req.params.id;

  //get the logged-in users ID from the session
  const userID = req.session.userID;

  //get the updated application values from the request body
  const {
    company,
    role_title,
    status,
    date_applied,
    notes
  } = req.body;

  console.log("PUT PARAM ID:", id);
  console.log("SESSION USER ID:", req.session.userID);

  //sql query to update a users application where the user id 
  //and the application id match the id's currently being used
  //WHERE checks both application ID and userID
  //This prevents one user from updation anothers users application
  const sql = `
    UPDATE ApplicationsTable
    SET company = ?,
        role_title = ?,
        status = ?,
        date_applied = ?,
        notes = ?
    WHERE id = ? AND userID = ?
  `;

  //Query execution for the listed parameters
  db.query(
    sql,
    [company, role_title, status, date_applied, notes, id, userID],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      //if no rows were changed, the application either does not exist 
      //or does not belong to the user
      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Application not found for this user"
        });
      }

      //sends a message back as json
      res.json({
        message: "Application updated successfully"
      });
    }
  );
});

// DELETE application belonging to the logged-in user
app.delete("/ApplicationsTable/:id", requireLogin, (req, res) => {

  //Application ID comes from the url
  const id = req.params.id;

  //user ID comes from the active session
  const userID = req.session.userID;

  //Query to delete an application belonging to a user
  //Both Application ID and user ID are required to match before deleting 
  //the row application
  const sql = "DELETE FROM ApplicationsTable WHERE id = ? AND userID = ?";

  //Query execution
  db.query(sql, [id, userID], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    //No matching row means either means the application does
    //not exist or it belongs to another user
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Application not found for this user"
      });
    }

    //message returned as json
    res.json({
      message: "Application deleted successfully"
    });
  });
});


//executed when user presses register on the register page
app.post("/register", async (req, res) => {

  // Get the email and password sent by the registration form.
  const { email, password } = req.body;

  try {

      //create a hashedpassword variable
      // Hash the password before storing it in the database.
      //the 10 means the number or salt rounds used
      //salt rounding generates a 16 byte string added to a password
      //before hashing a password.
      const hashedPassword = await bcrypt.hash(password, 10);

      //sql query to create a account using the two parameters
      //email and password. A userID is automatically asigned to the user
      //by the database once an account is created
      const sql = `
          INSERT INTO UsersTable
          (email, password)
          VALUES (?, ?)
      `;

      //exeutes the query using the listed attributes
      db.query(sql, [email, hashedPassword], (err, result) => {

          if (err) {

              //because email is UNIQUE in the database
              //mysql returns ER_DUP_ENTRY if the email already
              //belongs to an account
              if (err.code === "ER_DUP_ENTRY") {
                  return res.status(409).json({
                      message: "An account with this email already exists"
                  });
              }

              // Handle any other database error.
              return res.status(500).json({
                  message: "Could not create account"
              });
          }

          // Registration succeeded.
          res.status(201).json({
              message: "User registered successfully",
              userID: result.insertId
          });
      });

  } catch (error) {

    //this handles an unexpected errors such as bcrypt failures
      res.status(500).json({
          message: "Server error"
      });
  }
});

//runs once a user makes a login request
//Used to authenticate an existing user
app.post("/login", (req, res) => {

  //recieve the email and password sent by the login page
  const { email, password } = req.body;

  console.log("LOGIN BODY:", req.body);

  //execute query to find the account that matches the submitted email
  const sql = "SELECT * FROM UsersTable WHERE email = ?";

  //executes the query
  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    console.log("DB RESULTS:", results);

    //no matching email means authentication failure
    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    //the email columns is UNIQUE, so there should only be on matching user
    const user = results[0];

    console.log("STORED PASSWORD:", user.password);

    //compare the password entered by the user with the hashed password stored
    // inside the database
    const match = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", match);

    //reject the login if the passwords do not match
    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    //store the users id in their session
    //future protected requests can now identify 
    //which user is logged in
    req.session.userID = user.userID;

    res.json({
      message: "Login successful",
      userID: user.userID
    });
  });
});

//end the users current login session
app.post("/logout", (req, res) => {

  //destroy the stored session
  req.session.destroy((err) => {

    //error message if user cannot logout
    if(err){
      return res.status(500).json({
        message: "Could not log out"
      });
    }

    //success message
    //sent back in json
    res.json({
      message: "Logged out successfully"
    });
  });
});

//
app.get("/check-session", (req, res) => {
  res.json({
    session: req.session,
    userID: req.session ? req.session.userID : null
  });
});

//listens for http requests using the port defined in the .env file
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});