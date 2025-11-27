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
		// Employees
		api.GET("/employees", controllers.ListEmployees)
		api.GET("/employees/:id", controllers.GetEmployee)
		api.POST("/employees", controllers.CreateEmployee)
		api.PUT("/employees/:id", controllers.UpdateEmployee)
		api.DELETE("/employees/:id", controllers.DeleteEmployee)
		api.GET("/my-team", controllers.ListMyTeam)

		api.GET("/users/by-email/:email", controllers.GetUserByEmail)
		api.DELETE("/users/:id", controllers.DeleteUser)

		// Manager team
		api.GET("/managers/:managerId/team", controllers.ListTeam)

	}

	leaves := api.Group("/leaves")
	{
		leaves.POST("", controllers.CreateLeave)
		leaves.GET("/my", controllers.ListMyLeaves)
		leaves.GET("/team", controllers.ListTeamLeaves)
		leaves.GET("/balance", controllers.GetMyLeaveBalance)
		leaves.PUT("/:id/approve", controllers.ApproveLeave)
		leaves.PUT("/:id/reject", controllers.RejectLeave)
	}

	// PMS routes
	pms := api.Group("/pms")
	{
		// Employee
		pms.POST("/goals", controllers.CreateGoal)
		pms.PUT("/goals/:id", controllers.UpdateGoal)
		pms.GET("/my-goals", controllers.ListMyGoals)

		// Manager/Admin
		pms.GET("/manager/goals", controllers.ManagerListEmployeeGoals)
		pms.POST("/reviews", controllers.CreateOrUpdateReview)

		// Employee self-assessment
		pms.POST("/self-assess", controllers.SubmitSelfAssessment)

		// Admin analytics
		pms.GET("/admin/report", controllers.AdminReport)

		// History
		pms.GET("/my-reviews", controllers.MyReviews)
	}

	// Chatbot routes
	chatbot := api.Group("/chatbot")
	{
		chatbot.POST("/query", controllers.HandleChatbotQuery)
	}
}
