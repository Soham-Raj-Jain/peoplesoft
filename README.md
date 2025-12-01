# PeopleSoft - HR Management System

A comprehensive full-stack HR Management System with Performance Management, Goals Tracking, Leave Management, and AI-powered Chatbot assistance.

## 🚀 Tech Stack

**Backend:**
- Go 1.20+ with Gin framework
- PostgreSQL database
- JWT authentication
- RESTful API architecture

**Frontend:**
- React 18 with Vite
- Bootstrap 5 for UI
- Responsive design
- Role-based access control

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access (HR, Manager, Employee)
- Secure login/register system
- Protected routes and API endpoints

### 👥 Employee Management
- Employee onboarding
- Profile management
- Department and role assignment
- Team hierarchy (HR → Managers → Employees)

### 📊 Performance Management System (PMS)
- **Goals Management:**
  - Self-created goals with progress tracking
  - HR assigns goals to Managers
  - Managers assign goals to Employees
  - Goal acceptance workflow
  - Progress updates and submission
  - Approval system with ratings and feedback

- **Performance Reviews:**
  - Manager reviews for employees
  - HR reviews for managers
  - Rating system (1-5 scale)
  - Comments and feedback
  - Performance reports

### 🏖️ Leave Management
- Leave request submission
- Manager approval workflow
- HR oversight and management
- Leave balance tracking
- Leave history and status

### 🤖 AI Chatbot Assistant
- Natural language processing
- Context-aware responses
- Goal assignment via chat
- HR and Manager actions through chatbot
- Accessible from any page

### 📈 Dashboard & Analytics
- Role-specific dashboards
- Performance metrics
- Team overview
- Quick actions and notifications

## 🛠️ Setup Instructions

### Prerequisites
- Go 1.20 or higher
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone repo_https
   cd peoplesoft
   ```

2. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE peoplesoft_db;
   ```

3. **Configure environment variables:**
   
   Create `backend/.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=peoplesoft_db
   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   ```

4. **Install dependencies and run:**
   ```bash
   cd backend
   go mod tidy
   go run main.go
   ```

   Backend will start at: `http://localhost:8080`

5. **Seed the database (optional):**
   ```bash
   # Run the seed file to populate with test data
   psql -U postgres -d peoplesoft_db -f complete-seed-with-hash.sql
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Configure environment variables:**
   
   Create `frontend/.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

3. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev
   ```

   Frontend will start at: `http://localhost:5173`

### Docker Setup (Alternative)

Run backend and database with Docker Compose:

```bash
cd backend
docker compose up --build
```

Then run the frontend separately as shown above.

## 🔑 Test Credentials

After seeding the database, you can login with:

**HR Account:**
- Email: `peoplesoft.hr@gmail.com`
- Password: `hr123`

**Manager Account:**
- Email: `peoplesoft.manager@gmail.com`
- Password: `manager123`

**Employee Account:**
- Email: `peoplesoft.employee@gmail.com`
- Password: `employee123`

## 📁 Project Structure

```
peoplesoft/
├── backend/
│   ├── controllers/        # API controllers
│   │   ├── auth_controller.go
│   │   ├── employee_controller.go
│   │   ├── leave_controller.go
│   │   ├── pms_controller.go
│   │   ├── chatbot_controller.go
│   │   └── ...
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # JWT & auth middleware
│   ├── main.go           # Entry point
│   └── .env              # Environment config
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   └── Chatbot.jsx
│   │   ├── pages/        # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── Leaves.jsx
│   │   │   └── ...
│   │   ├── api/          # API client
│   │   └── App.jsx       # Main app component
│   └── .env              # Frontend config
│
├── complete-seed-with-hash.sql  # Database seed file
├── GIT_WALKTHROUGH.md          # Git workflow guide
└── README.md                   # This file
```

## 🎯 User Workflows

### HR Workflow
1. Login with HR credentials
2. View all employees and managers
3. Assign goals to managers
4. Review manager performance submissions
5. Approve/reject leave requests
6. Access analytics and reports

### Manager Workflow
1. Login with manager credentials
2. View goals assigned by HR
3. Accept and work on HR-assigned goals
4. Assign goals to team members
5. Review employee goal submissions
6. Approve team leave requests
7. Submit own goals for HR approval

### Employee Workflow
1. Login with employee credentials
2. View goals assigned by manager
3. Accept and track goal progress
4. Submit completed goals for review
5. Request leaves
6. View performance reviews

## 🤖 Chatbot Usage

The AI chatbot can help with:
- **Goal Assignment:** "Assign a goal to John Doe"
- **Information Queries:** "Show me my team's performance"
- **Quick Actions:** "Approve pending leaves"
- **Navigation Help:** "How do I submit a goal?"

Access the chatbot from the floating button on any page.

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee

### Goals (PMS)
- `GET /api/pms/my-goals` - Get user's self-created goals
- `POST /api/pms/goals` - Create new goal
- `PUT /api/pms/goals/:id` - Update goal
- `POST /api/pms/hr/assign-goals` - HR assign to manager
- `POST /api/pms/manager/assign-goals` - Manager assign to employee
- `POST /api/pms/goals/:id/accept` - Accept assigned goal
- `POST /api/pms/goals/:id/submit` - Submit goal for approval
- `GET /api/pms/pending-approvals` - Get pending approvals

### Performance Reviews
- `POST /api/pms/reviews/:goalId/approve` - Approve goal and create review
- `GET /api/performance/reviews` - Get performance reviews

### Leaves
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Submit leave request
- `PUT /api/leaves/:id/approve` - Approve leave (Manager/HR)
- `PUT /api/leaves/:id/reject` - Reject leave

### Chatbot
- `POST /api/chatbot` - Send message to chatbot

## 🔒 Security

- **JWT Authentication:** All protected routes require valid JWT tokens
- **Role-Based Access:** Endpoints enforce role permissions
- **Environment Variables:** Sensitive data stored in `.env` files
- **Password Hashing:** Bcrypt for secure password storage
- **CORS:** Configured for frontend-backend communication

## 📝 Development Notes

### Adding New Features
1. Create controller in `backend/controllers/`
2. Define routes in `backend/routes/`
3. Add frontend page in `frontend/src/pages/`
4. Update navigation in `App.jsx`

### Database Migrations
- Models auto-migrate on backend startup
- Manual migrations can be added in `main.go`

### Testing
- Backend: `go test ./...`
- Frontend: `npm test`

## 🐛 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Verify `.env` credentials
- Ensure port 8080 is available

**Frontend can't connect:**
- Verify backend is running on port 8080
- Check `VITE_API_BASE_URL` in frontend `.env`
- Clear browser cache and restart dev server

**Database errors:**
- Ensure database exists: `CREATE DATABASE peoplesoft_db;`
- Check user permissions
- Verify connection string in `.env`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Additional Resources

- [Go Gin Documentation](https://gin-gonic.com/docs/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

This project is part of an academic assignment for SJSU.

## 👥 Team
Jaya Vyas,
Prachi Gupta, 
Tamizh Selvan Manivannan,
Soham Raj Jain




## 🎓 Course Information

**Course:** CMPE 272 - Enterprise Software Platforms  
**Institution:** San Jose State University  
**Semester:** Fall 2025

---


