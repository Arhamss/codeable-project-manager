# Codeable Project Manager

A comprehensive project management system for software services companies, built with React, Firebase, and modern web technologies.

## Features

### 🔐 Authentication & Authorization
- **Email-based authentication** with Firebase Auth
- **Role-based access control** (Admin/User)
- **Protected routes** with automatic redirects
- **Profile management** with editable user information

### 👥 User Management
- **Admin Registration/Login** - Full system access
- **Team Member Registration/Login** - Project time tracking access
- **User Profiles** with department and contact information

### 📊 Project Management (Admin Features)
- **Create and manage projects** with detailed information
- **Cost breakdown** by category (Backend, Frontend Web, Frontend Mobile, UI Design, Deployment, Other)
- **Revenue and profit tracking** with real-time calculations
- **Estimated hours** allocation per work category
- **Project status management** (Planning, In Progress, On Hold, Completed, Cancelled)
- **Client information** and project descriptions
- **Timeline management** with start and end dates

### ⏰ Time Tracking (User Features)
- **Log work hours** with detailed descriptions
- **Work type categorization** (Backend, Frontend Web, Frontend Mobile, UI Design, Deployment, Testing, Documentation, Meetings, Other)
- **Date-based time entries** with validation
- **Project selection** from available projects
- **Personal time tracking dashboard**

### 📈 Analytics & Reporting
- **Project analytics** with progress tracking
- **Financial overview** with revenue, costs, and profit analysis
- **Hours breakdown** by work type and team member
- **Progress visualization** with completion percentages
- **Recent activity tracking**
- **Dashboard metrics** for both admins and users

### 🎨 Modern UI/UX
- **Dark theme** with beautiful gradient backgrounds
- **Responsive design** that works on all devices
- **Smooth animations** with Framer Motion
- **Loading states** and error handling
- **Toast notifications** for user feedback
- **Modal dialogs** for forms and confirmations

## Tech Stack

### Frontend
- **React 19** - Latest React with modern hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router DOM** - Client-side routing
- **React Hook Form** - Performant form management
- **Zod** - Type-safe schema validation
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Elegant notifications

### Backend & Database
- **Firebase Auth** - Authentication and user management
- **Cloud Firestore** - NoSQL database for real-time data
- **Firebase Storage** - File storage (ready for future features)

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and caching

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Email/Password
   - Create a Firestore database

2. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click "Web app"
   - Copy the configuration object

3. **Set up Environment Variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codeable_project_manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Create your first admin account by registering

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (buttons, spinners, etc.)
│   ├── forms/          # Form components
│   ├── charts/         # Chart components
│   └── modals/         # Modal dialogs
├── hooks/              # Custom React hooks
├── layouts/            # Page layout components
├── lib/                # External library configurations
├── pages/              # Page components (routes)
├── services/           # API and business logic
├── stores/             # State management (Zustand)
├── types/              # Type definitions and constants
├── utils/              # Utility functions
└── App.jsx             # Main application component
```

## Usage

### Admin Workflow

1. **Register as Admin**
   - Go to `/register`
   - Select "Administrator" role
   - Complete registration

2. **Create Projects**
   - Access admin dashboard
   - Click "New Project"
   - Fill in project details, costs, and estimated hours
   - Save the project

3. **Monitor Progress**
   - View project analytics
   - Track team member hours
   - Monitor financial performance

### User Workflow

1. **Register as Team Member**
   - Go to `/register`
   - Select "Team Member" role
   - Complete registration

2. **Log Time**
   - Access user dashboard
   - Click "Log Time"
   - Select project, work type, and enter hours
   - Add description of work completed

3. **Track Progress**
   - View personal statistics
   - See available projects
   - Monitor logged hours

## Firestore Database Structure

### Collections

#### `users`
```javascript
{
  id: "user_id",
  email: "user@example.com",
  name: "User Name",
  role: "admin" | "user",
  department: "Development",
  phone: "+1234567890",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `projects`
```javascript
{
  id: "project_id",
  name: "Project Name",
  description: "Project description",
  client: "Client Name",
  status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled",
  income: 50000,
  costs: {
    backend: 10000,
    frontend_web: 8000,
    frontend_mobile: 12000,
    ui_design: 5000,
    deployment: 2000,
    other: 1000
  },
  estimatedHours: {
    backend: 200,
    frontend_web: 150,
    frontend_mobile: 250,
    ui_design: 100,
    deployment: 50,
    other: 25
  },
  totalLoggedHours: 425,
  startDate: "2024-01-01",
  endDate: "2024-06-30",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `timeLogs`
```javascript
{
  id: "log_id",
  projectId: "project_id",
  userId: "user_id",
  userName: "User Name",
  workType: "backend" | "frontend_web" | "frontend_mobile" | "ui_design" | "deployment" | "testing" | "documentation" | "meetings" | "other",
  hours: 8.5,
  date: "2024-01-15",
  description: "Implemented user authentication system",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Features in Detail

### Real-time Updates
- Project data syncs in real-time across all users
- Time logs update project statistics immediately
- Live progress tracking

### Data Validation
- Form validation with Zod schemas
- Client-side and server-side validation
- Type-safe data handling

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Automatic retry mechanisms

### Performance
- Optimized React rendering
- Lazy loading of components
- Efficient state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.

---

Built with ❤️ for efficient project management in software services companies.# codeable-project-manager
