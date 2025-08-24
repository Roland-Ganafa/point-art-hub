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

## 🎯 Features

- **Multi-Module Inventory Management**:
  - 📝 Stationery (pens, paper, office supplies)
  - 🎁 Gift Store (cleaning, toys, birthday items)
  - 🧵 Embroidery Services (custom jobs, quotations)
  - 🖨️ Machine Services (printing, copying, scanning)
  - 🎨 Art Services (custom design work)

- **Sales Tracking**:
  - Daily sales recording with profit tracking
  - Sales person attribution with automatic initials
  - Real-time dashboard with statistics

- **User Management**:
  - Role-based access control (Admin/User)
  - Sales initials assignment
  - User profile management

- **Advanced Features**:
  - Stock level monitoring with alerts
  - Search functionality across all modules
  - CSV export capabilities
  - Responsive design for all devices

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context API
- **Testing**: Vitest, Testing Library

### Database Schema
The system includes the following main tables:
- `profiles` - User management with roles and sales initials
- `stationery` - Stationery inventory
- `gift_store` - Gift items inventory
- `embroidery` - Embroidery services and jobs
- `machines` - Machine services tracking
- `art_services` - Art and design services
- `stationery_sales` - Daily sales transactions

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** with Admin/User permissions
- **Secure authentication** via Supabase Auth
- **Data validation** on both client and server side

## 🧪 Testing

Run tests with:
```bash
npm test --prefix ".\\point-art-hub-main"
```

Run tests with UI:
```bash
npm run test:ui --prefix ".\\point-art-hub-main"
```

## 📱 Usage

### For Admins:
1. **User Management**: Create users, assign roles, manage sales initials
2. **Full CRUD Access**: Add, edit, delete items across all modules
3. **Reports**: Export data and view comprehensive analytics

### For Users:
1. **View Inventory**: Browse all inventory items (read-only)
2. **Record Sales**: Add sales transactions with profit tracking
3. **Add New Items**: Contribute new inventory items

### Key Workflows:

#### Recording a Sale:
1. Go to any module → **Daily Sales** tab
2. Click **"Record Sale"**
3. Select item, quantity, and sales person
4. System automatically calculates profit and updates stock

#### Managing Inventory:
1. Navigate to desired module (Stationery, Gifts, etc.)
2. Use **search** to find items quickly
3. Click **"Add Item"** to add new inventory
4. Admins can edit/delete existing items

#### Stock Monitoring:
- Low stock items show **red warning indicators**
- Dashboard displays real-time statistics
- Stock levels update automatically with sales

## 🆘 Troubleshooting

### Common Issues:

#### "No sales persons available" in dropdown:
1. Go to **Admin Profile**
2. Click **"Assign Sales Initials"**
3. This assigns initials (A, B, C...) to all users

#### Database connection errors:
1. Verify `.env` file has correct Supabase credentials
2. Check Supabase project is active and not paused
3. Ensure database setup script was run successfully

#### Permission denied errors:
1. Check user role in Admin Profile
2. Verify RLS policies are correctly applied
3. Ensure user is properly authenticated

#### Admin Panel Access Issues:
1. **Admin Button Not Visible**: 
   - Refresh the page (`Ctrl+F5` or `Cmd+Shift+R`)
   - Clear browser cache and cookies
   - Use the Emergency Admin Access feature (see below)

### Emergency Admin Access

In case of emergencies when normal admin access is not available, you can use the built-in emergency admin access features:

1. **Browser Console Method** (Development/Testing Only):
   - Press `F12` to open Developer Tools
   - Navigate to the "Console" tab
   - Run `makeCurrentUserAdmin()` to grant yourself admin privileges
   - Run `emergencyAdminAccess()` to navigate to the admin panel

2. **In-App Emergency Access**:
   - Navigate to the Admin Panel
   - Look for the "Emergency Admin Access" section
   - Follow the instructions to request emergency access

**⚠️ Security Warning**: Emergency access functions are for development and emergency use only. In production environments, these should be disabled or restricted to authorized personnel only.

### Getting Help:
- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure database schema is properly initialized

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