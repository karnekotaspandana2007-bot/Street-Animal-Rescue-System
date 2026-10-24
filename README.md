# Smart Street Animal Rescue System

A complete full-stack web application designed to facilitate the reporting and rescue of street animals in need.

## Features
- **User Role:** Report animals, open camera to capture photos, fetch GPS coordinates, and track rescue status.
- **Rescuer Role:** View assigned rescue missions, update rescue status, and upload completion photos.
- **Admin Role:** Comprehensive dashboard to verify incoming reports, reject spam, assign rescuers, and manage users.
- **Real-time Camera & GPS:** Implemented purely in the browser using HTML5 `navigator.mediaDevices` and `navigator.geolocation`.
- **JWT Authentication:** Secure role-based access control.

## Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Fetch API
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **File Upload:** Multer
- **Authentication:** JSON Web Tokens (JWT), bcryptjs

---

## Folder Structure
```text
Smart-Street-Animal-Rescue-System/
├── backend/                  # Node.js backend
│   ├── config/               # DB Connection
│   ├── controllers/          # API Controllers
│   ├── middleware/           # Auth and Upload Middleware
│   ├── models/               # MySQL Models (User, AnimalReport, RescueRecord)
│   ├── routes/               # Express Routes
│   ├── uploads/              # Stored Images
│   ├── server.js             # Entry Point
│   ├── seedAdmin.js          # Script to generate admin user
│   ├── .env                  # Environment Variables (Create this!)
│   └── package.json          
├── frontend/                 # Static HTML/CSS/JS frontend
│   ├── admin/                # Admin Panel
│   ├── rescuer/              # Rescuer Portal
│   ├── user/                 # User Dashboard
│   ├── css/                  # Stylesheets
│   ├── js/                   # Vanilla JS Scripts (api.js, auth.js, location.js)
│   ├── index.html            # Landing Page
│   ├── login.html            
│   └── register.html         
└── README.md                 # This file
```

---

## Requirements
- Node.js installed on your Windows machine.
- VS Code (with Live Server extension recommended).
- MySQL Server installed locally (or a cloud MySQL instance).

---

## Setup Instructions for Windows + VS Code

### 1. MySQL Database Setup
1. Ensure your local MySQL server is running (e.g., via MySQL Workbench, XAMPP, or Windows Services).
2. Create the database (or let the app auto-create tables):
   ```sql
   CREATE DATABASE IF NOT EXISTS smart_animal_rescue;
   ```
3. Update your `backend/.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smart_animal_rescue
   DB_PORT=3306
   ```

### 2. Backend Setup
1. Open a terminal in VS Code and navigate to the backend folder:
   ```cmd
   cd backend
   ```
2. Install the necessary dependencies:
   ```cmd
   npm install
   ```
3. Run the seed script to create your first Admin user:
   ```cmd
   npm run seed-admin
   ```
   *Note: Default admin: `admin@gmail.com` / `adminpassword123`.*
4. Start the Node.js server:
   ```cmd
   npm run dev
   ```
   You should see:
   ```
   Server running on port 5000
   MySQL Connected Successfully
   ```

### 3. Frontend Setup
We DO NOT use `file://` to open the frontend because the Camera and GPS APIs require a secure context or `localhost`.
1. In VS Code, install the **Live Server** extension by Ritwick Dey.
2. Right-click on `frontend/index.html` and select **"Open with Live Server"**.
3. It will open in your browser at something like `http://127.0.0.1:5500/frontend/index.html`.

---

## Complete Browser Testing Flow (No Postman Required!)

1. **Register as a User:** Go to Register page, create an account, then Login.
2. **Report Animal:** In the User Dashboard, click "Report an Animal".
3. **Use Features:** Click "Open Camera" to take a photo. Click "Use My Current Location" to get GPS. Submit the report.
4. **Admin Verification:** Logout, then login as `admin@gmail.com` (password: `adminpassword123`). Go to "Manage Reports", find your report, click **Verify**.
5. **Assign Rescuer:** While in Admin, click **Assign Rescuer**. Select a rescuer from the dropdown (default: `rescuer@gmail.com` / `rescuerpassword123`).
6. **Rescuer Action:** Logout, login as the Rescuer. Go to "Assigned Reports", View Details, click **Start Rescue**, then **Complete Rescue**.
7. **User Checking:** Login back as the original User, go to "My Reports", and observe the status changed to **Completed**.

---

## Common Errors and Solutions

**Q: Camera or GPS is not working!**
- Ensure you are running the frontend via a local server (like Live Server `http://127.0.0.1:5500`) and NOT by double-clicking the HTML file (`file:///C:/...`). Browsers block these APIs on local file protocols.
- Check if your browser is blocking location/camera permissions in the URL bar.

**Q: MySQL Connection Error in backend terminal.**
- Check that MySQL service is running on your machine.
- Verify your DB credentials in `backend/.env`.

**Q: "Failed to fetch" or "Network Error" on login/register.**
- Ensure the Node.js backend is actually running on `http://localhost:5000`. Keep the terminal open.
- Check if `api.js` points to `http://localhost:5000/api`.
