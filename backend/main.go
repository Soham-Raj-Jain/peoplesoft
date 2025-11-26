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

	// Auto migrate models
	if err := config.DB.AutoMigrate(
		&models.User{},
		&models.Employee{},
		&models.Department{},
		&models.Leave{},
		&models.Performance{},
		&models.ReviewCycle{},
		&models.Goal{},
		&models.SelfAssessment{},
		&models.ManagerReview{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

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

	// Performance Routes
	performance := r.Group("/api/performance")
	performance.Use(middleware.AuthRequired())
	{
		//	performance.GET("/", controllers.GetAllPerformances)
		performance.GET("/my", controllers.GetMyPerformances)
		performance.GET("/team", controllers.GetTeamPerformances)
		performance.POST("/:id/comment", controllers.AddPerformanceComment)
		performance.PUT("/:id", controllers.UpdatePerformanceScore)
		//	performance.POST("/:id/accept", controllers.AcceptPerformance)
		//	performance.POST("/:id/rediscuss", controllers.RequestRediscussion)
	}

	// All other routes (employees, leaves, goals, etc.)
	routes.SetupRoutes(r)

	// Start server
	log.Println("========================================")
	log.Println("🚀 Backend Server Started Successfully!")
	log.Println("========================================")
	log.Println("📍 Port: 8080")
	log.Println("📊 Dashboard API: http://localhost:8080/api/dashboard/stats")
	log.Println("🔐 Auth API: http://localhost:8080/api/auth/login")
	log.Println("========================================")

	r.Run(":8080")
}
