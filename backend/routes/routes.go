package routes

import (
	"peoplesoft/controllers"
	"peoplesoft/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Protected API routes
	api := r.Group("/api")
	api.Use(middleware.AuthRequired())
	{
		// ========== EMPLOYEES ==========
api.GET("/employees/team", controllers.ListMyTeam)  // ⭐ NEW - Must be first!
api.GET("/my-team", controllers.ListMyTeam)
api.GET("/employees", controllers.ListEmployees)
api.GET("/employees/:id", controllers.GetEmployee)
api.POST("/employees", controllers.CreateEmployee)
api.PUT("/employees/:id", controllers.UpdateEmployee)
api.DELETE("/employees/:id", controllers.DeleteEmployee)

		// ========== USERS ==========
		api.GET("/users/by-email/:email", controllers.GetUserByEmail)
		api.DELETE("/users/:id", controllers.DeleteUser)

		// ========== MANAGER TEAM ==========
		api.GET("/managers/:managerId/team", controllers.ListTeam)
	}

	// ========== LEAVES ==========
	leaves := api.Group("/leaves")
	{
		leaves.POST("", controllers.CreateLeave)
		leaves.GET("/my", controllers.ListMyLeaves)
		leaves.GET("/team", controllers.ListTeamLeaves)
		leaves.GET("/balance", controllers.GetMyLeaveBalance)
		leaves.PUT("/:id/approve", controllers.ApproveLeave)
		leaves.PUT("/:id/reject", controllers.RejectLeave)
		leaves.PUT("/:id/withdraw", controllers.WithdrawLeave)
	}

	// NOTE: PMS routes are now defined in main.go under /api/pms
	// This avoids duplication and keeps all PMS logic centralized

	// Chatbot routes
	chatbot := api.Group("/chatbot")
	{
		chatbot.POST("/query", controllers.HandleChatbotQuery)
	}
}
