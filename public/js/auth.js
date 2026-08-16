
console.log("auth.js loaded");

//Get the registration form if the user is on my registration page

const registerForm = document.getElementById("registerForm");

if(registerForm){

//Code is run once the user submits the registration form
registerForm.addEventListener("submit", async (e) => {

  //Stops the browser from refreshing the page
  e.preventDefault();

  console.log("form submitted");

  //variables to get the users registration details
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  //Send the registration details to the backend /register route
  const response = await fetch("/register", {
    method: "POST", //create method

    //tells the backend that the request body contains json data
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ //Converts objects to json text to be sent to server
      email,
      password
    })
  });

  //wait for the server response and convert the json
  //Convert the backend response into a javascript object
  const data = await response.json();

  //Display the response message to then user
  document.getElementById("message").textContent = data.message;

  //if the registration was a success, direct the user to the login page
  if(response.ok){
    window.location.href = "/login.html";
  }
});
}

//get login form if the user clicks login button

const loginForm = document.getElementById("loginForm");


if(loginForm){

//Code is run once the user submits the login form
loginForm.addEventListener("submit", async (e) =>{
  e.preventDefault();

  console.log("login form submitted");

  //Varaibles used to stored the users login details
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  //login details are sent to the backend
  const response = await fetch("/login",{
    method: "POST",
    headers: {
      //tell the backend that the request body contains json data
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ //both objects are converted to json text to be read by the server
      email,
      password
    })
  });

  //converts the backend response from json into javascrpt objects
  const data = await response.json();

  //response message is displayed
  document.getElementById("message").textContent = data.message;

  //if login was successful, user is taken to dashboard
  if(response.ok){
    window.location.href = "/dashboard.html";
  }
});
}