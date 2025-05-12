# Nepal Central High School - Pre-Primary Student Record-Keeping System

A comprehensive multi-user web application for managing pre-primary students at Nepal Central High School in Kathmandu. This system aligns with Nepal's Complete Pre-Primary System (ECED) and supports multiple teachers under admin control.

## Features

### User Management (Admin Only)
- Create, edit, and delete teacher accounts
- Assign students to teachers by class
- Manage all system data

### Student Management
- Create, edit, and delete student profiles
- Store comprehensive student information
- Upload student photos via Cloudinary
- Filter students by class/teacher

### Progress Tracking
- Log student progress across key developmental areas
- Customize tracking fields by class level
- View complete progress history

### Teaching Plans
- Create annual, monthly, and weekly teaching plans
- Generate AI-powered suggestions via DeepSeek API
- Filter plans by type/class/teacher

### Report Generation
- Generate comprehensive PDF student reports
- Export teaching plans and student data to Excel
- Custom formats with school branding

### Security & Offline Support
- Role-based authentication system
- Offline functionality with SQLite
- Secure data handling and encryption

## Technology Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express (REST API)

### Database
- SQLite (local usage)
- PostgreSQL support (optional)

### Key Libraries
- Drizzle ORM
- jsPDF & xlsx for report generation
- Cloudinary for image uploads
- DeepSeek API for AI suggestions

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create `.env` file and add necessary environment variables (see `.env.example`)
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret

# Database Configuration (SQLite by default)
DATABASE_URL=file:./dev.db

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_api_key
```

## PostgreSQL Configuration (Optional)

To switch from SQLite to PostgreSQL:

1. Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```
2. Run the database migrations:
   ```
   npm run db:push
   ```

## Default Credentials

The system comes with pre-configured accounts:

### Admin
- Email: admin@school.com
- Password: lkg123

### Teachers
- Teacher 1 (Nursery)
  - Email: teacher1@school.com
  - Password: lkg123
- Teacher 2 (LKG)
  - Email: teacher2@school.com
  - Password: lkg123
- Teacher 3 (UKG)
  - Email: teacher3@school.com
  - Password: lkg123

## User Roles

### Admin
- Full system access
- Manage teacher accounts
- Assign students to teachers
- Access all data

### Teachers
- Access only assigned students
- Create and track progress for assigned students
- Create teaching plans for assigned classes
- Generate reports for assigned students

## ECED Framework Implementation

The system is designed around Nepal's Early Childhood Education and Development (ECED) framework:

### Student Categories
- Learning Ability: Talented, Average, Slow Learner
- Writing Speed: Slow Writing, Speed Writing (optional for Nursery)

### Progress Assessment Areas
- Social Skills
- Pre-Literacy
- Pre-Numeracy
- Motor Skills
- Emotional Development

### Class-Specific Features
- Nursery (~3 years): Focus on motor skills and social development
- LKG (~4 years): Enhanced pre-literacy and pre-numeracy
- UKG (~5 years): Advanced activities preparing for primary school

## Offline Functionality

The system supports offline operation:
- SQLite database for local storage
- Cached DeepSeek API responses
- Automatic syncing when online connection is restored

## Report Generation

### PDF Reports
- School branding with "Nepal Central High School" header
- Class-specific layouts
- Comprehensive student information and progress history

### Excel Reports
- Tabular data format
- Filterable by class/teacher
- Includes student metrics and latest progress assessments

## License

This project is licensed under the MIT License.