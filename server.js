require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");

const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false
}));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

function requireLogin(req, res, next) {

  if(!req.session || !req.session.userID){
    return res.status(401).json({
      message : "Please log in first"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.send("JobTracker API is running!");
});

// GET all applications
app.get("/ApplicationsTable", requireLogin, (req, res) => {

  const userID = req.session.userID;

  const sql = `
    SELECT * FROM ApplicationsTable
    WHERE userID = ?
  `;

  db.query(sql, [userID], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }
    
    res.json(results);
  });
});

// CREATE application for user currently logged in
app.post("/ApplicationsTable", requireLogin, (req, res) => {
  const userID = req.session.userID; //Get the logged-in users ID from the session

  const {
    company,
    role_title,
    status,
    date_applied,
    notes
  } = req.body; //get the application details sent by the dashboard form

  const sql = `
    INSERT INTO ApplicationsTable
    (userID, company, role_title, status, date_applied, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userID, company, role_title, status, date_applied, notes],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.status(201).json({
        message: "Application added successfully",
        id: result.insertId
      });
    }
  );
});

// UPDATE application
app.put("/ApplicationsTable/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;

  const {
    company,
    role_title,
    status,
    date_applied,
    notes
  } = req.body;

  console.log("PUT PARAM ID:", id);
  console.log("SESSION USER ID:", req.session.userID);

  const sql = `
    UPDATE ApplicationsTable
    SET company = ?,
        role_title = ?,
        status = ?,
        date_applied = ?,
        notes = ?
    WHERE id = ? AND userID = ?
  `;

  db.query(
    sql,
    [company, role_title, status, date_applied, notes, id, userID],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Application not found for this user"
        });
      }

      res.json({
        message: "Application updated successfully"
      });
    }
  );
});

// DELETE application
app.delete("/ApplicationsTable/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;

  const sql = "DELETE FROM ApplicationsTable WHERE id = ? AND userID = ?";

  db.query(sql, [id, userID], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Application not found for this user"
      });
    }

    res.json({
      message: "Application deleted successfully"
    });
  });
});

app.post("/register", async (req, res) => {

  // Get the email and password sent by the registration form.
  const { email, password } = req.body;

  try {

      // Hash the password before storing it in the database.
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
          INSERT INTO UsersTable
          (email, password)
          VALUES (?, ?)
      `;

      db.query(sql, [email, hashedPassword], (err, result) => {

          if (err) {

              // The email already exists in a UNIQUE email column.
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

      res.status(500).json({
          message: "Server error"
      });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN BODY:", req.body);

  const sql = "SELECT * FROM UsersTable WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    console.log("DB RESULTS:", results);

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    console.log("STORED PASSWORD:", user.password);

    const match = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    req.session.userID = user.userID;

    res.json({
      message: "Login successful",
      userID: user.userID
    });
  });
});

app.post("/logout", (req, res) => {

  req.session.destroy((err) => {

    if(err){
      return res.status(500).json({
        message: "Could not log out"
      });
    }

    res.json({
      message: "Logged out successfully"
    });
  });
});

app.get("/check-session", (req, res) => {
  res.json({
    session: req.session,
    userID: req.session ? req.session.userID : null
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});