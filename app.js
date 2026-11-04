
/*
 FITIWEBS EDUCATIONAL RECORDS
 Supabase JavaScript Application
*/

// 1. SUPABASE CONFIGURATION

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. ELEMENTS

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authForm = document.getElementById("authForm");
const recordForm = document.getElementById("recordForm");

const authButton = document.getElementById("authButton");
const authStatus = document.getElementById("authStatus");
const formStatus = document.getElementById("formStatus");
const logoutBtn = document.getElementById("logoutBtn");

const recordsContainer =
  document.getElementById("recordsContainer");

let isSignup = false;
let currentRecords = [];

// 3. MESSAGE FUNCTION

function showStatus(element, message, success = false) {
  element.textContent = message;
  element.style.color = success ? "#168c83" : "#c0392b";
}

// 4. AUTHENTICATION

document.getElementById("switchAuth")
.addEventListener("click", () => {

  isSignup = !isSignup;

  authButton.textContent =
    isSignup ? "Create Account" : "Login";

  document.getElementById("authMessage").textContent =
    isSignup ? "Already registered?" : "New user?";

  document.getElementById("switchAuth").textContent =
    isSignup ? "Login" : "Create Account";

  authStatus.textContent = "";
});

authForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  authButton.disabled = true;

  try {

    let result;

    if (isSignup) {

      result = await db.auth.signUp({
        email,
        password
      });

      if (!result.error) {
        showStatus(
          authStatus,
          "Account created. Check your email if verification is required.",
          true
        );
      }

    } else {

      result = await db.auth.signInWithPassword({
        email,
        password
      });

    }

    if (result.error) throw result.error;

    if (result.data.session) {
      await updateInterface(result.data.session);
    }

  } catch (error) {

    showStatus(authStatus, error.message);

  } finally {

    authButton.disabled = false;

  }

});

// 5. INTERFACE MANAGEMENT

async function updateInterface(session) {

  const loggedIn = Boolean(session);

  authSection.classList.toggle("hidden", loggedIn);
  appSection.classList.toggle("hidden", !loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    await loadRecords();
  }

}

// 6. SAVE RECORDS

recordForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const saveBtn = document.getElementById("saveBtn");

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {

    const data = Object.fromEntries(
      new FormData(recordForm).entries()
    );

    Object.keys(data).forEach(key => {
      data[key] = data[key].trim();
    });

    const fields = [
      "course_name",
      "learning_goal",
      "experience_level",
      "favorite_topic",
      "learning_format",
      "study_schedule",
      "project_idea",
      "tools_used",
      "learning_challenge",
      "additional_notes"
    ];

    for (const field of fields) {
      if (!data[field]) {
        throw new Error("Please complete all fields.");
      }
    }

    const { data: saved, error } = await db
      .from("educational_records")
      .insert([data])
      .select("id")
      .single();

    if (error) throw error;

    recordForm.reset();

    showStatus(
      formStatus,
      "Record saved successfully! ID: " + saved.id,
      true
    );

    await loadRecords();

  } catch (error) {

    showStatus(formStatus, error.message);

  } finally {

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Educational Record";

  }

});

// 7. RETRIEVE RECORDS

async function loadRecords() {

  recordsContainer.innerHTML =
    "<p>Loading records...</p>";

  const { data, error } = await db
    .from("educational_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {

    recordsContainer.textContent =
      "Unable to retrieve records: " + error.message;

    return;
  }

  currentRecords = data || [];

  renderRecords(currentRecords);

}

// 8. DISPLAY RECORDS

function renderRecords(records) {

  recordsContainer.innerHTML = "";

  if (!records.length) {

    recordsContainer.textContent =
      "No educational records found.";

    return;
  }

  records.forEach(record => {

    const card = document.createElement("article");
    card.className = "record";

    const title = document.createElement("h3");
    title.textContent = record.course_name;

    const date = document.createElement("small");
    date.textContent =
      new Date(record.created_at).toLocaleString();

    card.append(title, date);

    const labels = {
      learning_goal: "Learning Goal",
      experience_level: "Experience Level",
      favorite_topic: "Favorite Topic",
      learning_format: "Learning Format",
      study_schedule: "Study Schedule",
      project_idea: "Project Idea",
      tools_used: "Tools Used",
      learning_challenge: "Learning Challenge",
      additional_notes: "Additional Notes"
    };

    Object.entries(labels).forEach(([key, label]) => {

      const paragraph = document.createElement("p");

      paragraph.textContent =
        label + ": " + record[key];

      card.appendChild(paragraph);

    });

    const id = document.createElement("small");
    id.textContent = "Record ID: " + record.id;

    card.appendChild(id);

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete Record";

    deleteButton.addEventListener("click", () => {
      deleteRecord(record.id);
    });

    card.appendChild(deleteButton);

    recordsContainer.appendChild(card);

  });

}

// 9. SEARCH RECORDS

document.getElementById("searchInput")
.addEventListener("input", event => {

  const query = event.target.value.toLowerCase();

  const filtered = currentRecords.filter(record =>

    Object.values(record).some(value =>
      String(value).toLowerCase().includes(query)
    )

  );

  renderRecords(filtered);

});

// 10. DELETE RECORDS

async function deleteRecord(id) {

  if (!confirm("Delete this educational demonstration record?")) {
    return;
  }

  const { error } = await db
    .from("educational_records")
    .delete()
    .eq("id", id);

  if (error) {

    alert("Unable to delete record: " + error.message);

    return;
  }

  alert("Record deleted successfully.");

  await loadRecords();

}

// 11. REFRESH

document.getElementById("refreshBtn")
.addEventListener("click", loadRecords);

// 12. LOGOUT

logoutBtn.addEventListener("click", async () => {

  const { error } = await db.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  await updateInterface(null);

});

// 13. CHECK EXISTING LOGIN

db.auth.onAuthStateChange((event, session) => {

  if (event === "INITIAL_SESSION") {
    updateInterface(session);
  }

});
