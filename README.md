# JobTracker

Project Description:
JobTracker is a full-stack web application built with Node.js, Express, MySQL, JavaScript, HTML, and CSS. 
Job Tracker allows a user to register an account, log in, and manage their job applications through a 
clean and responsive dashboard with application tracking, status management, notes, and CRUD functionality.


# Features

- User Registeration
- Secure Log in and out
- Password Hashing
- Create, Retrieve, update and delete Applications
- Status Tracking
- Notes for each application
- Notes Modal
- Responsive Dashboard


# Tech Stack

Frontend:
- HMTL
- CSS
- JavaScript

Backend:
- Express
- Node.js

Database:
- mySQL

Authentication:
- bycrpt
- express-session


# Future Improvements

- New user inputs on the dashboard such as salary range and website link
- Chart tracking the total number of applications submitted by the user


# Installation

1. Clone the repository.

   ```bash
   git clone https://github.com/AlanLeeder/JobTracker.git
   ```

2. Navigate into the project folder.

   ```bash
   cd JobTracker
   ```

3. Install the required dependencies.

   ```bash
   npm install
   ```

4. Create the database.

   Open MySQL Workbench and run the provided `database.sql` file.  
   This will create the JobTracker database and the required tables.

5. Create your environment file.

   Copy the provided `.env.example` file and create a new file called `.env`.

   Replace the placeholder values with your own details:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=JobTracker
   PORT=3000
   SESSION_SECRET=your_session_secret
   ```

6. Start the server.

   ```bash
   node server.js
   ```

7. Open JobTracker.

   Open your browser and go to:

   `http://localhost:3000`

   Create an account, log in and start tracking your job applications.
   
   
   







