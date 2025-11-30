package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"peoplesoft/config"
	"peoplesoft/controllers"
	"peoplesoft/middleware"
	"peoplesoft/models"
	"peoplesoft/routes"
	"peoplesoft/utils"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Initialize Auth0
	utils.InitAuth0()

	// Connect to database
	if err := config.ConnectDatabase(); err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}

	// Auto migrate ALL models (including PMS models)
	if err := config.DB.AutoMigrate(
		&models.User{},
		&models.Employee{},
		&models.Department{},
		&models.Leave{},
		&models.LeaveAllocation{},
		&models.Performance{},
		&models.ReviewCycle{},
		&models.Goal{},
		&models.SelfAssessment{},
		&models.ManagerReview{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	
	log.Println("✅ Database migrations completed successfully")

	// Initialize Gin router
	r := gin.Default()
	r.Use(config.CorsMiddleware())

	// ========================================
	// PUBLIC ROUTES (No Authentication)
	// ========================================
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
		auth.POST("/auth0-login", controllers.Auth0Login)
	}

	// ========================================
	// PROTECTED ROUTES (Require Authentication)
	// ========================================

	// Dashboard Routes
	dashboard := r.Group("/api/dashboard")
	dashboard.Use(middleware.AuthRequired())
	{
		dashboard.GET("/stats", controllers.GetDashboardStats)
	}

	// Performance Routes (Legacy - keep for backward compatibility)
	performance := r.Group("/api/performance")
	performance.Use(middleware.AuthRequired())
	{
		performance.GET("/my", controllers.GetMyPerformances)
		performance.GET("/team", controllers.GetTeamPerformances)
		performance.POST("/:id/comment", controllers.AddPerformanceComment)
		performance.PUT("/:id", controllers.UpdatePerformanceScore)
	}

	// ========================================
	// PMS ROUTES (New Consolidated System)
	// ========================================
	pms := r.Group("/api/pms")
	pms.Use(middleware.AuthRequired())
	{
		// ========== GOALS MANAGEMENT ==========
		
		// Employee: Create and manage their own goals
		pms.POST("/goals", controllers.CreateGoal)
		pms.PUT("/goals/:id", controllers.UpdateGoal)
		pms.GET("/my-goals", controllers.ListMyGoals)
		
		// Get goals assigned to current user
		pms.GET("/my-assigned-goals", controllers.GetMyAssignedGoals)
		
		// Accept and submit goals
		pms.POST("/goals/:id/accept", controllers.AcceptGoal)
		pms.POST("/goals/:id/submit", controllers.SubmitGoalForApproval)
		
		// ========== HR FUNCTIONS ==========
		
		// HR assigns goals to managers
		pms.POST("/hr/assign-goals", middleware.RoleMiddleware("hr"), controllers.HRAssignGoalsToManager)
		
		// ========== MANAGER FUNCTIONS ==========
		
		// Manager assigns goals to employees
		pms.POST("/manager/assign-goals", middleware.RoleMiddleware("manager"), controllers.ManagerAssignGoalsToEmployee)
		
		// View employee goals (manager/hr only)
		pms.GET("/manager/goals", middleware.RoleMiddleware("manager", "hr"), controllers.ManagerListEmployeeGoals)
		
		// ========== APPROVALS & REVIEWS ==========
		
		// Get pending approvals (manager/hr only)
		pms.GET("/pending-approvals", middleware.RoleMiddleware("manager", "hr"), controllers.GetPendingApprovals)
		
		// Approve goal and create review
		pms.POST("/reviews/:goal_id/approve", middleware.RoleMiddleware("manager", "hr"), controllers.ApproveGoalAndReview)
		
		// View my reviews
		pms.GET("/my-reviews", controllers.MyReviews)
		pms.GET("/reviews-given", controllers.ReviewsGiven)
		pms.GET("/all-reviews", controllers.AllReviews) 
		// ========== SELF ASSESSMENT ==========
		
		// Submit self-assessment
		pms.POST("/self-assess", controllers.SubmitSelfAssessment)
		
		// ========== REPORTS ==========
		
		// Performance reports (role-based access)
		pms.GET("/reports/performance", controllers.PerformanceReports)
	}

	// All other routes (employees, leaves, etc.)
	routes.SetupRoutes(r)

	// Start server
	log.Println("========================================")
	log.Println("🚀 Backend Server Started Successfully!")
	log.Println("========================================")
	log.Println("📍 Port: 8080")
	log.Println("📊 Dashboard API: http://localhost:8080/api/dashboard/stats")
	log.Println("🔐 Auth API: http://localhost:8080/api/auth/login")
	log.Println("🎯 PMS API: http://localhost:8080/api/pms/*")
	log.Println("========================================")

	r.Run(":8080")
}