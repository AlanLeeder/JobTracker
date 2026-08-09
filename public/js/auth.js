console.log("auth.js loaded");

const registerForm = document.getElementById("registerForm");

if(registerForm){
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("form submitted");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();

  document.getElementById("message").textContent = data.message;

  if(response.ok){
    window.location.href = "/login.html";
  }
});
}

const loginForm = document.getElementById("loginForm");

if(loginForm){
loginForm.addEventListener("submit", async (e) =>{
  e.preventDefault();

  console.log("login form submitted");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/login",{
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();

  document.getElementById("message").textContent = data.message;

  if(response.ok){
    window.location.href = "/dashboard.html";
  }
});
}