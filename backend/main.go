package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"peoplesoft/config"
	"peoplesoft/controllers"
	"peoplesoft/models"
	"peoplesoft/routes"
	"peoplesoft/utils"
)

func main() {

	// Load env
	_ = godotenv.Load()

	utils.InitAuth0()

	if err := config.ConnectDatabase(); err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}

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

	r := gin.Default()
	r.Use(config.CorsMiddleware())

	// 🔥 REQUIRED ROUTE
	auth := r.Group("/api/auth")
	{
		auth.POST("/auth0-login", controllers.Auth0Login)
	}

	routes.SetupRoutes(r)

	log.Println("Backend running on :8080")
	r.Run(":8080")
}
