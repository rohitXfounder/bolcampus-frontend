const API_URL = "https://complaint-backend-2.onrender.com";
console.log("SCRIPT LOADED SUCCESSFULLY");

// ------------------------------
// 🔐 Admin state
// ------------------------------
let isAdminLoggedIn = false;


// ======================================================
// 🔔 TOAST SYSTEM
// ======================================================
function showToast(message, type = "info") {

    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


// ======================================================
// 🧾 STUDENT: Submit Complaint (FIXED FOR DOUBLE CLICK)
// ======================================================
const complaintForm = document.getElementById("complaintForm");
// 1. Get the button so we can disable it
const submitBtn = complaintForm ? complaintForm.querySelector('button[type="submit"]') : null;

if (complaintForm && submitBtn) {
    complaintForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // --- 🛑 STOP DOUBLE CLICKS START ---
        submitBtn.disabled = true; 
        submitBtn.innerText = "Submitting... Please wait";
        // ------------------------------------

        let id = "CMP" + Date.now();
        let formData = new FormData();

        formData.append("id", id);
        formData.append("name", document.getElementById("name").value);
        formData.append("branch", document.getElementById("branch").value);
        formData.append("division", document.getElementById("division").value);
        formData.append("roll", document.getElementById("roll").value);
        formData.append("issue", document.getElementById("issue").value);
        formData.append("description", document.getElementById("description").value);
        formData.append("status", "Pending");
        formData.append("createdAt", new Date().toISOString());

        let imageFile = document.getElementById("image").files[0];
        if (imageFile) {
            formData.append("image", imageFile);
        }

        fetch(`${API_URL}/add`, {
            method: "POST",
            body: formData
        })
            .then(res => res.text())
            .then(() => {
                document.getElementById("uniqueIdDisplay").innerText =
                    "Your Complaint ID: " + id;

                    // ✨ ADD THIS LINE to make the button appear
                document.getElementById("copyBtn").style.display = "inline-block";

                complaintForm.reset();
                showToast("Complaint submitted", "success");
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#007bff', '#ffc107', '#28a745'] // Matches blue, yellow, and green theme
                });
            })
            .catch((error) => {
            console.error("Error:", error);
            if (!navigator.onLine) {
                showToast("Internet Disconnected! Please reconnect to submit.", "error");
            } else {
                showToast("Server is waking up. Please wait 10 seconds and try again.", "error");
            }
        })
            .finally(() => {
                // --- ✅ BRING BUTTON BACK TO NORMAL ---
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Complaint";
                // --------------------------------------
            });
    });
}


// ======================================================
// 🔍 TRACK COMPLAINT (OPTIMIZED)
// ======================================================
function trackComplaint() {
    const idInput = document.getElementById("trackId");
    let rawId = idInput.value.trim();

    // 1. Clean the ID (Removes "Your Complaint ID: " if pasted)
    let id = rawId.includes(":") ? rawId.split(":")[1].trim() : rawId;

    if (!id) {
        showToast("Please enter a Complaint ID", "error");
        return;
    }

    const trackBtn = document.querySelector("button[onclick='trackComplaint()']");
    if (trackBtn) {
        trackBtn.innerText = "Searching...";
        trackBtn.disabled = true;
    }

    // 2. The Fetch (Check if your backend uses /get/ or /track/)
    console.log("Attempting to track ID:", id); 
    console.log("Full URL:", `${API_URL}/get/${id}`);

    fetch(`${API_URL}/get/${id}`)
        .then(res => {
            console.log("Server Response Status:", res.status);
            if (!res.ok) throw new Error("ID not found on server");
            return res.json();
        })
        .then(data => {
            // Some backends return an array, some return a single object
            const complaint = Array.isArray(data) ? data[0] : data;

            if (complaint && complaint.status) {
                document.getElementById("statusDisplay").innerText = "Status: " + complaint.status;
                showToast("Status Updated!", "success");
            } else {
                showToast("Invalid ID. Please check again.", "error");
            }
        })
        .catch(err => {
            console.error("DETAILED ERROR:", err);
            
            // If the error is "404", it's an Invalid ID, not a server wake-up issue
            if (err.message.includes("not found")) {
                showToast("Complaint ID not found in database.", "error");
            } else {
                showToast("Connection issue. Try again in 10s.", "error");
            }
        })
        .finally(() => {
            if (trackBtn) {
                trackBtn.innerText = "Track";
                trackBtn.disabled = false;
            }
        });
}


// ======================================================
// 🔐 ADMIN LOGIN (MODIFIED FOR LOADING STATE)
// ======================================================
function adminLogin() {
    let passInput = document.getElementById("adminPass");
    let pass = passInput.value;
    
    // 1. Get the Login Button
    const loginBtn = document.querySelector(".admin-container button[onclick='adminLogin()']");

    // 2. Start Loading State
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerText = "Verifying...";
    }

    fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
    })
    .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            isAdminLoggedIn = true;
            // ✅ ADD THIS LINE: Clear the password input field immediately
    document.getElementById("adminPass").value = "";

            // Show all admin controls
            document.getElementById("searchBox").style.display = "inline-block";
            document.getElementById("statusFilter").style.display = "inline-block";
            document.getElementById("branchFilter").style.display = "inline-block";
            document.getElementById("issueFilter").style.display = "inline-block";
            
            // NEW: This shows the bar that contains your Export Button
           document.getElementById("statsContainer").style.display = "block";
            
            document.getElementById("toDate")?.style && 
                (document.getElementById("toDate").style.display = "inline-block");
            document.getElementById("logoutBtn").style.display = "inline-block";

            loadAdminTable();
            showToast("Login successful", "success");
        } else {
            showToast("Wrong password", "error");
        }
    })
    .catch(err => {
        console.error("LOGIN ERROR:", err);
        if (!navigator.onLine) {
            showToast("No Internet Connection. Please check your Wi-Fi/Data.", "error");
        } else {
            showToast("Server is busy or waking up. Please wait 10 seconds and try again.", "error");
        }
    })
    .finally(() => {
        // 3. Stop Loading State (Bring button back to normal)
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerText = "Login";
        }
    });
}
// Add Enter Key support for Admin Login
document.getElementById("adminPass")?.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        adminLogin();
    }
});

// ======================================================
// 📊 ADMIN TABLE (DATE FILTER REMOVED)
// ======================================================
function loadAdminTable() {
    // ✅ 1. GET FILTER INPUTS (Search, Status, Branch, Issue)
    const searchBox = document.getElementById("searchBox");
    const statusFilter = document.getElementById("statusFilter");
    const branchFilter = document.getElementById("branchFilter");
    const issueFilter = document.getElementById("issueFilter");

    const searchTerm = (searchBox?.value || "").toLowerCase();
    const statusVal = statusFilter?.value || "All";
    const branchVal = branchFilter?.value || "All";
    const issueVal = issueFilter?.value || "All";

    fetch(`${API_URL}/all`)
        .then(res => res.json())
        .then(data => {
            // ✅ 2. FILTER THE DATA (No Date Logic)
            const filteredData = data.filter(c => {
                const matchesSearch = !searchTerm || 
                                     c.id.toLowerCase().includes(searchTerm) || 
                                     c.name.toLowerCase().includes(searchTerm);
                
                const matchesStatus = (statusVal === "All" || c.status === statusVal);
                const matchesBranch = (branchVal === "All" || branchVal.includes("All") || c.branch === branchVal);
                const matchesIssue = (issueVal === "All" || issueVal.includes("All") || c.issue === issueVal);

                return matchesSearch && matchesStatus && matchesBranch && matchesIssue;
            });

            // ✅ 3. UPDATE STATS
            renderStats(filteredData);

            // ✅ 4. BUILD TABLE (All Columns: ID, Name, Branch, Roll, Issue, Status, Date, Image, Action)
            let panel = `
                <h3>Search Results</h3>
                <table border="1">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Roll</th>
                        <th>Issue</th>
                        <th>Status</th>
                        <th>Date & Time</th>
                        <th>Image</th>
                        <th>Action</th>
                    </tr>
            `;

            if (filteredData.length === 0) {
                panel += `<tr><td colspan="9" style="text-align:center; padding:20px;">No complaints found.</td></tr>`;
            } else {
                filteredData.forEach(c => {
                    panel += `
                    <tr>
                        <td class="clickable" data-id="${c.id}">${c.id}</td>
                        <td class="clickable" data-id="${c.id}">${c.name}</td>
                        <td class="clickable" data-id="${c.id}">${c.branch}</td>
                        <td class="clickable" data-id="${c.id}">${c.roll}</td>
                        <td class="clickable" data-id="${c.id}">${c.issue}</td>
                        <td>
                            <select onchange="updateStatus('${c.id}', this.value)">
                                <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                                <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
                                <option ${c.status === "Completed" ? "selected" : ""}>Completed</option>
                            </select>
                        </td>
                        <td class="clickable" data-id="${c.id}">${formatDate(c.createdAt)}</td>
                        <td>
                            ${c.imagePath 
                                ? `<img src="${API_URL}/uploads/${c.imagePath}" width="80" class="img-preview" style="cursor:pointer; border-radius:6px; object-fit: cover; height: 50px;" onerror="this.parentElement.innerHTML='File Deleted';">` 
                                : "No Image"
                            }
                        </td>
                        <td>
                            <button onclick="event.stopPropagation(); deleteComplaint('${c.id}')">Delete</button>
                        </td>
                    </tr>`;
                });
            }

            panel += `</table>`;
            document.getElementById("adminPanel").innerHTML = panel;
            
            if (typeof attachTableEvents === "function") attachTableEvents();
        })
        .catch(err => console.error("Load Error:", err));
}


// ======================================================
// 🔄 UPDATE STATUS
// ======================================================
function updateStatus(id, newStatus) {

    fetch(`${API_URL}/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    })
        .then(() => {
            loadAdminTable();
            showToast("Status updated", "success");
        })
        .catch(() => showToast("Update failed", "error"));
}


// ======================================================
// 🗑️ DELETE
// ======================================================
function deleteComplaint(id) {

    if (!confirm("Delete this complaint?")) return;

    fetch(`${API_URL}/delete/${id}`, {
        method: "DELETE"
    })
        .then(() => {
            loadAdminTable();
            showToast("Complaint deleted", "info");
        })
        .catch(() => showToast("Delete failed", "error"));
}


// ======================================================
// 🔍 FILTER
// ======================================================
window.filterComplaints = function () {

    let search = document.getElementById("searchBox").value.toLowerCase();
    let status = document.getElementById("statusFilter").value;
    let branch = document.getElementById("branchFilter").value;
    let issue = document.getElementById("issueFilter").value;
    let selectedDate = document.getElementById("fromDate")?.value;

    fetch(`${API_URL}/all`)
        .then(res => res.json())
        .then(data => {

            // 🔥 APPLY FILTER FIRST (IMPORTANT)
            let filtered = data.filter(c => {

                let id = (c.id || "").toLowerCase();
                let name = (c.name || "").toLowerCase();

                let matchSearch =
                    id.includes(search) || name.includes(search);

                let matchStatus =
                    status === "All" || c.status === status;

                let matchBranch =
                    branch === "All" ||
                    (c.branch || "").toLowerCase().trim() === branch.toLowerCase().trim();

                let matchIssue =
                    issue === "All" ||
                    (c.issue || "").toLowerCase().trim() === issue.toLowerCase().trim();

                // DATE FILTER (SAFE)
             let matchDate = true;

            if (selectedDate) {
                let complaintDate = (c.createdAt || "").split("T")[0]; // "2026-04-24"
                matchDate = complaintDate === selectedDate;
            }

                return matchSearch && matchStatus && matchBranch && matchIssue && matchDate;
            });

            // 🔥 UPDATE STATS
            renderStats(filtered);

            // 🔥 BUILD TABLE
            let html = `
                <h3>Search Results</h3>
                <table border="1">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Roll</th>
                        <th>Issue</th>
                        <th>Status</th>
                        <th>Date & Time</th>
                        <th>Image</th>
                        <th>Action</th>
                    </tr>
            `;

            filtered.forEach(c => {
                html += `
                    <tr>
                        <td class="clickable" data-id="${c.id}">${c.id}</td>
                        <td class="clickable" data-id="${c.id}">${c.name}</td>
                        <td class="clickable" data-id="${c.id}">${c.branch}</td>
                        <td class="clickable" data-id="${c.id}">${c.roll}</td>
                        <td class="clickable" data-id="${c.id}">${c.issue}</td>

                        <td>
                            <select onchange="updateStatus('${c.id}', this.value)">
                                <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                                <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
                                <option ${c.status === "Completed" ? "selected" : ""}>Completed</option>
                            </select>
                        </td>

                        <td>${formatDate(c.createdAt)}</td>

                        <td>
                            ${
                                c.imagePath
                                ? `<img 
                                    src="${API_URL}/uploads/${c.imagePath}" 
                                    width="80"
                                    class="img-preview"
                                    data-img="${c.imagePath}"
                                    style="cursor:pointer; border-radius:6px; object-fit: cover; height: 50px;"
                                    onerror="this.style.display='none'; this.parentElement.innerHTML='File Deleted';"
                                >`
                                : "No Image"
                            }
                        </td>

                        <td>
                            <button onclick="event.stopPropagation(); deleteComplaint('${c.id}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `</table>`;
            document.getElementById("adminPanel").innerHTML = html;

            // 🔥 REATTACH EVENTS
            attachTableEvents();
        });
};

function showImagePopup(imagePath) {

    let html = `
        <h3>Complaint Image</h3>
        <img 
    src="${API_URL}/uploads/${imagePath}"
    style="width:100%; border-radius:10px;"
    onerror="this.src='https://cdn-icons-png.flaticon.com/512/4076/4076432.png';"
>
    `;

    document.getElementById("popupDetails").innerHTML = html;
    document.getElementById("popup").style.display = "block";
}

function attachTableEvents() {

    // 🔍 Details click
    document.querySelectorAll(".clickable").forEach(cell => {
        cell.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            showDetails(id);
        });
    });

    // 🖼️ Image click
    document.querySelectorAll(".img-preview").forEach(img => {
        img.addEventListener("click", function () {
            const path = this.getAttribute("data-img");
            showImagePopup(path);
        });
    });
}

// ======================================================
// 🚪 LOGOUT
// ======================================================
function logout() {

    isAdminLoggedIn = false;

    document.getElementById("adminPanel").innerHTML = "";

    let statsBar = document.getElementById("statsBar");
    if (statsBar) {
        statsBar.style.display = "none"; // ⬅️ THIS LINE FIXES YOUR PROBLEM
    }

    document.getElementById("searchBox").style.display = "none";
    document.getElementById("statusFilter").style.display = "none";
    document.getElementById("branchFilter").style.display = "none";
    document.getElementById("issueFilter").style.display = "none";
    document.getElementById("fromDate").style.display = "none";

    document.getElementById("logoutBtn").style.display = "none";

    document.getElementById("adminPass").value = "";

    showToast("Logged out", "info");
}


// ======================================================
// 📄 DETAILS POPUP
// ======================================================
function showDetails(id) {

    fetch(`${API_URL}/get/${id}`)
        .then(res => res.json())
        .then(data => {

            let c = data[0];

            let details = `
                <h3>Complaint Details</h3>
                <p><b>ID:</b> ${c.id}</p>
                <p><b>Name:</b> ${c.name}</p>
                <p><b>Branch:</b> ${c.branch}</p>
                <p><b>Division:</b> ${c.division}</p>
                <p><b>Roll:</b> ${c.roll}</p>
                <p><b>Issue:</b> ${c.issue}</p>
                <p><b>Description:</b> ${c.description}</p>
                <p><b>Status:</b> ${c.status}</p>
                <p><b>Date:</b> ${formatDate(c.createdAt)}</p>
            `;

            document.getElementById("popupDetails").innerHTML = details;
            document.getElementById("popup").style.display = "block";
        });
}



// ======================================================
// ❌ CLOSE POPUP
// ======================================================
function closePopup() {
    document.getElementById("popup").style.display = "none";
}


// ======================================================
// ❌ OUTSIDE CLICK CLOSE
// ======================================================
window.onclick = function (event) {
    let popup = document.getElementById("popup");
    if (event.target === popup) {
        popup.style.display = "none";
    }
};


// ======================================================
// 🔗 ADMIN REDIRECT
// ======================================================
function openAdmin() {
    window.location.href = "admin.html";
}

window.adminLogin = adminLogin;
window.filterComplaints = filterComplaints;
window.updateStatus = updateStatus;
window.deleteComplaint = deleteComplaint;
window.showDetails = showDetails;
window.logout = logout;
window.trackComplaint = trackComplaint;
window.openAdmin = openAdmin;

function renderStats(data) {

    let total = data.length;
    let pending = data.filter(c => c.status === "Pending").length;
    let progress = data.filter(c => c.status === "In Progress").length;
    let completed = data.filter(c => c.status === "Completed").length;

    let html = `
        <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
            
            <div class="stat-box">Total: ${total}</div>
            <div class="stat-box">Pending: ${pending}</div>
            <div class="stat-box">In Progress: ${progress}</div>
            <div class="stat-box">Completed: ${completed}</div>

        </div>
    `;

    let statsBar = document.getElementById("statsBar");
    statsBar.innerHTML = html;
    statsBar.style.display = "block";
}

function formatDate(dateString) {
    if (!dateString) return "N/A";

    let d = new Date(dateString);

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    });
}

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme); // Remember choice
});
}

// Load saved theme on refresh
if (localStorage.getItem("theme") === "light") {
    document.documentElement.setAttribute("data-theme", "light");
}

// Function to copy ONLY the Complaint ID to the clipboard
function copyID() {
    const text = document.getElementById("uniqueIdDisplay").innerText;
    
    // 💡 IMPROVED LOGIC: 
    // This splits the text at the colon and takes everything after it.
    // Even if the sentence changes, it finds the ID.
    const parts = text.split(":");
    const idOnly = parts.length > 1 ? parts[1].trim() : text.trim();
    
    if (idOnly) {
        navigator.clipboard.writeText(idOnly).then(() => {
            showToast("ID Copied to Clipboard!", "success");
            
            const copyBtn = document.getElementById("copyBtn");
            if (copyBtn) {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
            }
        }).catch(err => {
            console.error("Could not copy text: ", err);
            showToast("Copy failed. Please select text manually.", "error");
        });
    }
}

async function exportComplaintsToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast("Excel library not loaded!", "error");
        return;
    }

    try {
        // 1. Fetch the absolute latest data from the server
        const response = await fetch(`${API_URL}/all`);
        const data = await response.json();

        if (!data || data.length === 0) {
            showToast("No data found to export!", "error");
            return;
        }

        // 2. Map the data to remove 'Image' and 'Action' automatically
        const excelData = data.map(c => ({
            "Complaint ID": c.id,
            "Student Name": c.name,
            "Branch": c.branch,
            "Roll No": c.roll,
            "Issue": c.issue,
            "Status": c.status,
            "Date & Time": formatDate(c.createdAt)
        }));

        // 3. Create the Excel structure
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "All_Complaints");

        // 4. Set Column Widths
        worksheet['!cols'] = [
            { wch: 22 }, { wch: 20 }, { wch: 15 }, 
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
        ];

        // 5. Download
        XLSX.writeFile(workbook, `BOLCAMPUS_Full_Report_${new Date().toLocaleDateString()}.xlsx`);
        showToast(`Exported ${data.length} complaints!`, "success");

    } catch (error) {
        console.error("Export Error:", error);
        showToast("Database sync failed. Try again.", "error");
    }
}

// ======================================================
// 🔄 AUTO-REFRESH LOGIC
// ======================================================

// Set the interval to 30 seconds (30000 milliseconds)
const REFRESH_INTERVAL = 30000; 

setInterval(() => {
    // Only refresh if the admin is actually logged in
    // (Check if the adminPanel is visible or statsContainer is block)
    const statsContainer = document.getElementById("statsContainer");
    
    if (statsContainer && statsContainer.style.display !== "none") {
        console.log("Auto-refreshing dashboard data...");
        loadAdminTable();
    }
}, REFRESH_INTERVAL);