# Point Art Hub - Inventory Management System

A comprehensive inventory management system built with React, TypeScript, and Supabase for managing stationery, gifts, embroidery services, machine services, and art services.

## 🚀 Quick Setup with New Supabase Database

Follow these steps to set up the project with a brand new Supabase database:

### Prerequisites

- Node.js (v16 or higher)
- npm package manager
- A Supabase account (free at [supabase.com](https://supabase.com))

### Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Project Name**: `point-art-hub`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Click **"Create new project"**
5. Wait 2-3 minutes for project creation

### Step 2: Get Supabase Credentials

1. In your new project, go to **Settings → API**
2. Copy these values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **anon public** key
   - **service_role secret** key (optional, for admin functions)

### Step 3: Setup Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `database_setup.sql` file
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the script


6. You should see a success message: "🎉 Point Art Hub database setup completed successfully!"

### Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   npm run setup:env --prefix ".\\point-art-hub-main"


   ```

2. Open the newly created `.env` file and update it:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co


   VITE_SUPABASE_ANON_KEY=your-anon-key-here


   VITE_APP_ENV=development


   VITE_APP_NAME=Point Art Hub


   ```

### Step 5: Install Dependencies and Run

1. Install dependencies:
   ```bash


   npm install --prefix ".\\point-art-hub-main"


   ```

2. Start the development server:
   ```bash


   npm run dev --prefix ".\\point-art-hub-main"


   ```

3. Open your browser to `http://localhost:5173` (or the URL shown in terminal)


### Step 6: Create Your First Admin User

1. Click **"Sign Up"** on the login page


2. Create your account with email and password


3. You'll be automatically logged in as the first user (admin)


4. Go to **Admin Profile** to manage users and assign sales initials


## 🔄 Database Updates

To update the database tables with new features and improvements:


### Using the Batch Script (Windows)


```

```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```


```

Run tests with UI:


```
npm run test:ui --prefix ".\\point-art-hub-main"


```

## 📱 Usage


### For Admins:


1.


   **User Management**: Create users


2.


   **Full CRUD Access**: Add


3.


   **Reports**: Export data and view comprehensive analytics


### For Users:


1.


   **View Inventory**: Browse all inventory items (read-only)


2.


   **Record Sales**: Add sales transactions with profit tracking


3.


   **Add New Items**: Contribute new inventory items


### Key Workflows:


#### Recording a Sale:


1.


   Go to any module → **Daily Sales** tab


2.


   Click **"Record Sale"**


3.


   Select item,   quantity,   and sales person


4.


   System automatically calculates profit and updates stock


#### Managing Inventory:


1.


   Navigate to desired module (Stationery,   Gifts,


   etc.)


2.


   Use **search** to find items quickly


3.


   Click **"Add Item"** to add new inventory


4.


   Admins can edit/delete existing items


#### Stock Monitoring:


- Low stock items show **red warning indicators**


- Dashboard displays real-time statistics


- Stock levels update automatically with sales


## 🛠️ Troubleshooting


If you encounter issues with the Point Art Hub system, please refer to our detailed [Troubleshooting Guide](TROUBLESHOOTING.md) which covers:


- Common authentication issues and solutions


- Database connection problems


- Network connectivity issues


- Performance optimization tips


- Development mode usage


The guide includes step-by-step instructions for diagnosing and resolving the most common problems.


You can also run the automated troubleshooting script:


```bash


node troubleshoot.js


```


## 📄 License


This project is built for inventory management purposes. Please ensure proper data backup and security measures in production environments.


## 🤝 Contributing


1. Fork the repository


2. Create a feature branch


3. Make your changes


4. Add tests for new functionality


5. Submit a pull request


---


**Happy Inventory Management! 🎉**

