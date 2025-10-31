# Employee Attendance and Vehicle Monitoring System

A modern employee attendance and vehicle monitoring management system built with **Vue.js** and **Node.js**, supporting QR code check-in, real-time monitoring, and data analytics.

## Features

### Employee Management
- **Employee Information Management** – Comprehensive employee profile management  
- **QR Code Check-In/Out** – Fast QR-based sign-in and sign-out  
- **Attendance Analytics** – Detailed attendance records and reports  
- **Certificate Management** – Employee certificate maintenance and expiry reminders  

### Vehicle Monitoring
- **Vehicle Information Management** – Maintain detailed vehicle profiles  
- **Real-Time Location Tracking** – GPS tracking and route playback  
- **Violation Detection** – Monitor speeding, boundary crossing, and other violations  
- **Maintenance Reminders** – Automatic reminders for servicing, inspection, etc.  

### Data Analytics
- **Real-Time Dashboard** – Key metrics visualized at a glance  
- **Attendance Reports** – Multi-dimensional attendance analysis  
- **Vehicle Reports** – Vehicle utilization statistics  
- **Violation Analytics** – Violation trends and analysis  

### System Management
- **User Authentication** – JWT-based user authentication  
- **Role-Based Access Control** – Fine-grained permission management  
- **System Settings** – Flexible system configuration  
- **Data Backup** – Automated data backup and recovery  

## Architecture

### Frontend Stack
- Framework: Vue.js 3 + TypeScript  
- Build Tool: Vite  
- UI Library: Element Plus  
- State Management: Pinia  
- Routing: Vue Router  
- Charts: ECharts  
- Maps: AMap (Gaode) API  
- Styling: CSS3 + Responsive Design  

### Backend Stack
- Runtime: Node.js  
- Framework: Express.js  
- Database: SQLite  
- Authentication: JWT (JSON Web Tokens)  
- File Uploads: Multer  
- API Design: RESTful API  

### Development Tools
- Package Management: npm workspaces (monorepo)  
- Code Quality: ESLint + Prettier  
- Version Control: Git  
- IDE: VS Code  

## Project Structure

```
monitoring-system/
├── apps/
│   ├── frontend/                 # Vue.js frontend app
│   │   ├── src/
│   │   │   ├── components/       # Common components
│   │   │   ├── views/            # Page components
│   │   │   ├── stores/           # Pinia state stores
│   │   │   ├── router/           # Route configuration
│   │   │   ├── utils/            # Utility functions
│   │   │   └── assets/           # Static assets
│   │   ├── public/               # Public resources
│   │   └── package.json
│   └── backend/                  # Node.js backend app
│       ├── routes/               # API routes
│       ├── middleware/           # Middleware
│       ├── uploads/              # File uploads directory
│       ├── database.db           # SQLite database
│       ├── server.js             # Server entry point
│       └── package.json
├── docs/                         # Project documentation
├── scripts/                      # Development scripts
├── package.json                  # Root package.json
└── README.md                     # Project overview
```

## Quick Start

### Requirements
- Node.js >= 16.0.0  
- npm >= 8.0.0  

### Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd monitoring-system

# Install dependencies
npm install

# Install concurrently (to run frontend and backend together)
npm install concurrently --save-dev
```

### Start Development Environment

#### Option 1: One-Command Start (Recommended)
```bash
npm run dev
```

#### Option 2: PowerShell Script
```powershell
.\scripts\dev.ps1
```

#### Option 3: Start Separately
```bash
# Start backend (Terminal 1)
cd apps/backend
npm run dev

# Start frontend (Terminal 2)
cd apps/frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173  
- Backend API: http://localhost:3000  
- API Docs: http://localhost:3000/api-docs (if configured)  

### Default Credentials
- Username: `admin`  
- Password: `123456`  

## Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Employee Attendance and Vehicle Monitoring System
```

#### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=./database.db
```

### Database
The project uses SQLite. The database file and schema will be automatically created on first run.

## API Documentation

### Authentication
- `POST /auth/login` – User login  
- `POST /auth/logout` – User logout  
- `GET /auth/profile` – Get user profile  

### Employee Management
- `GET /api/employees` – Get employee list  
- `POST /api/employees` – Create employee  
- `PUT /api/employees/:id` – Update employee  
- `DELETE /api/employees/:id` – Delete employee  

### Attendance Management
- `GET /api/attendance` – Get attendance records  
- `POST /api/attendance/checkin` – Check in  
- `POST /api/attendance/checkout` – Check out  
- `GET /api/attendance/qrcode` – Generate QR code for check-in  

### Vehicle Management
- `GET /api/vehicles` – Get vehicle list  
- `POST /api/vehicles` – Add vehicle  
- `PUT /api/vehicles/:id` – Update vehicle  
- `GET /api/vehicles/:id/location` – Get vehicle location  

### Statistics
- `GET /api/statistics/dashboard` – Dashboard data  
- `GET /api/statistics/attendance` – Attendance statistics  
- `GET /api/statistics/vehicles` – Vehicle statistics  

## Development Guide

### Adding New Features
1. Backend: Add new route in `apps/backend/routes/`  
2. Frontend: Add new page in `apps/frontend/src/views/`  
3. Update router configuration and navigation menu  

### Database Operations
```javascript
// Example: query employees
const employees = await db.all('SELECT * FROM employees WHERE status = ?', ['active']);
```

### Frontend State Management
```typescript
// Example using Pinia store
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
await authStore.login(credentials)
```

## Testing

### Run Tests
```bash
# Frontend tests
cd apps/frontend
npm run test

# Backend tests
cd apps/backend
npm run test
```

### Functional Testing
Open `/test-frontend.html` to test frontend functionality.

## Build & Deployment

### Build for Production
```bash
# Build frontend
cd apps/frontend
npm run build

# Build backend (if necessary)
cd apps/backend
npm run build
```

### Deployment Recommendations
- Frontend: Deploy to CDN or static hosting  
- Backend: Deploy to Node.js server  
- Database: Migrate to production database (MySQL/PostgreSQL recommended)  

## Contribution Guide

1. Fork the repository  
2. Create a new branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Submit a Pull Request  

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

## Issue Reporting

If you encounter any issues, please submit them via **GitHub Issues** or contact the development team.

## Contact

- Maintainer: **David Du**  
- Email: **dupt321@gmail.com**  
- Repository: https://github.com/DDuu123321/Intelligent-management-system

---

**Last Updated:** September 2, 2024  
**Version:** v1.0.0
