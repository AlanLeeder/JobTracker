// This function loads all of the logged-in user's job applications
// from the database and displays them in the table.
console.log("dashboard.js loaded");

// Stores the ID of the application currently being edited.
// A value of null means the form is being used to create a new application.
let editingApplicationID = null;

async function loadApplications() {

    // Send a GET request to our backend
    const response = await fetch("/ApplicationsTable");

    //If session expires user is sent back to login instead of seeing an error
    if(response.status === 401){
        window.location.href = "/login.html"
        return
    }

    //Error message if server error occurs
    if(!response.ok){
        throw new Error("could not load applications")
    }

    // Convert the JSON response into a JavaScript array
    const applications = await response.json();

    // Get the body of the table from the HTML page
    const tableBody = document.getElementById("applicationTableBody");

    // Clear the table before adding fresh data
    tableBody.innerHTML = "";

    // Loop through every application returned from the database
    applications.forEach(app => {

        // Create a new table row
        const row = document.createElement("tr");

        // Store the application's database ID on the table row.
        // This lets us identify the selected application later.
        row.dataset.id = app.id;

        // Store the application status on the row so Edit can restore it reliably.
        row.dataset.status = app.status;

        //Store the completer note so it can be shown in the modal
        //without displaying all of it inside the table
        row.dataset.notes = app.notes || "";

        // Format the date so it only displays YYYY-MM-DD
        const formattedDate = app.date_applied
            ? app.date_applied.split("T")[0]
            : "";

        // Fill the row with the application's information
        //Span class status badge creates a new class for each status so they can be styled differently
        row.innerHTML = `
            <td>${app.company}</td>
            <td>${app.role_title}</td>

            <td>
                <span class="status-badge status-${app.status.toLowerCase()}">
                    ${app.status}
                </span>
            </td>

            <td>${formattedDate}</td>

            <td>
                <button
                    type="button"
                    class="notes-preview-button"
                    onclick="openNotesModal(${app.id})"
                >
                    ${
                        app.notes
                            ? app.notes.slice(0,25) + //Takes the first 25 chars of the note
                            (app.notes.length > 25 ? "..." : "") //checks if note is longer than 25 chars if so add ...
                            : "No notes"
                    }
                </button>
            </td>    
            <td>
                <button 
                    class="edit-button"
                    onclick="editApplication(${app.id})"
                >
                    Edit
                </button>

                <button 
                    class="delete-button"
                    onclick="deleteApplication(${app.id})"
                >
                    Delete
                </button>
            </td>
        `;

        // Add the completed row to the table
        tableBody.appendChild(row);

    });
}

const logoutButton = document.getElementById("logoutButton");

//Log the user out and return them to the login page
logoutButton.addEventListener("click", async() =>{
    try{
        const response = await fetch("/logout",{
            method: "POST"
        });

        //if error occurs
        if(!response.ok){
            throw new Error("Logout Failed");
        }

        //location of where the button brings the user
        window.location.href = "/login.html";
    }catch(error){
        console.error("logout Error:" , error)
    }
});


//put an applications exisitng details into the form
//so the user can change them

function editApplication(id){

    //Find the table row that contains the matching application ID
    const row = document.querySelector(`tr[data-id="${id}"]`);

    //Stop if no matching row can be found
    if(!row){
        console.error("Application row could not be found");
        return;
    }

    //get all of the cells inside the selected table row
    const cells = row.children;

    //copy the current values from the row into the form inputs
    document.getElementById("company").value =
    cells[0].textContent;

    document.getElementById("role_title").value =
    cells[1].textContent;

    /*Restore the exact status value into the dropdown*/
    document.getElementById("status").value =
    row.dataset.status;

    document.getElementById("date_applied").value =
    cells[3].textContent;

    //Restore the complete note from the rows stored data
    document.getElementById("notes").value = row.dataset.notes;

    // Remember which application is being edited.
    editingApplicationID = id;

    // Change the button text so the user knows they are updating.
    const submitButton = document.querySelector(
    "#applicationForm button[type='submit']"
    );

    submitButton.textContent = "Update Application";   
    
    cancelEditButton.hidden = false;
}

const applicationForm = document.getElementById("applicationForm");
const message = document.getElementById("message");
//Get the cancel edit button from the html page
const cancelEditButton = document.getElementById("cancelEditButton");

// Elements used by the Notes modal
const notesModal = document.getElementById("notesModal");
const fullNotesText = document.getElementById("fullNotesText");
const closeNotesModal = document.getElementById("closeNotesModal");
const closeNotesButton = document.getElementById("closeNotesButton");
const notesModalOverlay = document.querySelector(".notes-modal-overlay");

// Open the notes modal for one specific application.
function openNotesModal(id) {

    // Find the table row that belongs to the selected application.
    const row = document.querySelector(`tr[data-id="${id}"]`);

    if (!row) {
        console.error("Application row could not be found");
        return;
    }

    // Read the complete note stored on the row.
    const fullNote = row.dataset.notes;

    // Display either the note or a friendly fallback message.
    fullNotesText.textContent =
        fullNote || "No notes have been added for this application.";

    // Remove the hidden attribute so the modal becomes visible.
    notesModal.hidden = false;
}


// Close the notes modal.
function closeNotes() {
    notesModal.hidden = true;
}

// Close the modal using either the X button or the Close button.
closeNotesModal.addEventListener("click", closeNotes);
closeNotesButton.addEventListener("click", closeNotes);

// Close the modal if the user clicks the dark background.
notesModalOverlay.addEventListener("click", closeNotes);

// Call the function when the page first loads
loadApplications();

applicationForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Stop the form from refreshing the page

    console.log("Application form submitted");

    const applicationData = {
        company: document.getElementById("company").value,
        role_title: document.getElementById("role_title").value,
        status: document.getElementById("status").value,
        date_applied: document.getElementById("date_applied").value,
        notes: document.getElementById("notes").value
    }; // Store the form values in one JavaScript object

    try {
        // Check whether the form is creating a new application
        // or updating an existing one.
        const isEditing = editingApplicationID !== null;

        // If editing, add the application's ID to the URL.
        // Otherwise, use the normal applications route.
        const url = isEditing
            ? `/ApplicationsTable/${editingApplicationID}`
            : "/ApplicationsTable";

        // PUT updates an existing application.
        // POST creates a brand-new application.
        const method = isEditing ? "PUT" : "POST";

        // Send either the POST or PUT request to the backend.
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(applicationData)
        });

        const data = await response.json(); // Convert the backend response into JavaScript

        if (!response.ok) {
            message.textContent =
                data.message || "Could not save application";
            return;
        }

        message.textContent = data.message; // Show the success message

        applicationForm.reset(); // Clear the form fields

        //Leave editing mode after the application has been Saved
        editingApplicationID = null;

        // Change the submit button back to its original text
        document.querySelector(
            "#applicationForm button[type='submit']"
        ).textContent = "Add Application";

        cancelEditButton.hidden = true;

        await loadApplications(); // Reload the table with the new application

    } catch (error) {
        console.error("Error adding application:", error);

        message.textContent = "Could not add application";
    }
});

// Run this code when the user clicks the Cancel Edit button.
cancelEditButton.addEventListener("click", () =>{

    //clear all values currently inside the form
    applicationForm.reset();

    //Remove the ID of the application being edited.
    //Setting it back to null means the form is now in create mode.
    editingApplicationID = null;

    //change the submit button text back to "Add Application"
    document.querySelector(
        "#applicationForm button[type='submit']"
    ).textContent = "Add Application";

    //Hide the cancel edit button because editing has ended.
    cancelEditButton.hidden = true;

    //clear any message still on screen.
    message.textContent = "";
})

//Delete one application from the database
//The id parameter tells us exactly which application to delete
async function deleteApplication(id){

    const confirmed = confirm(
        "Are you sure you want to delete this application"
    );

    if(!confirmed){
        return;
    }

    try{
        //Send a delete request to the backend.
        //The applications id is added to the end of the url
        const response = await fetch(
            `/ApplicationsTable/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        //if something went wrong, show the error message
        if(!response.ok){
            alert(data.message);
            return;
        }

        //reload the table so the deleted application disappears
        await loadApplications();

    }catch (error){

        //This only runs if something unexpected happens
        console.error(error);
    }
}