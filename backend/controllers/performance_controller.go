package controllers

import (
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"
	_ "peoplesoft/utils"
	_ "strconv"

	"github.com/gin-gonic/gin"
)

// GetMyPerformances - Employee views their own
func GetMyPerformances(c *gin.Context) {
	email := c.GetString("email") // From JWT middleware

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var performances []models.Performance
	config.DB.Where("employee_id = ?", user.ID).
		Preload("Employee").
		Find(&performances)

	c.JSON(http.StatusOK, performances)
}

// GetTeamPerformances - Manager views their team
func GetTeamPerformances(c *gin.Context) {
	email := c.GetString("email")

	var user models.User
	config.DB.Where("email = ?", email).First(&user)

	// Get team members who report to this manager
	var teamMembers []models.Employee
	config.DB.Where("manager_id = ?", user.ID).Find(&teamMembers)

	var teamIDs []uint
	for _, member := range teamMembers {
		teamIDs = append(teamIDs, member.UserID)
	}

	var performances []models.Performance
	config.DB.Where("employee_id IN ?", teamIDs).
		Preload("Employee").
		Find(&performances)

	c.JSON(http.StatusOK, performances)
}

// AddPerformanceComment - Any authenticated user can comment
func AddPerformanceComment(c *gin.Context) {
	id := c.Param("id")
	email := c.GetString("email")

	var body struct {
		Comment string `json:"comment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comment required"})
		return
	}

	var performance models.Performance
	if err := config.DB.First(&performance, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Performance not found"})
		return
	}

	// Append comment with user email
	newComment := email + ": " + body.Comment
	if performance.Comments != "" {
		performance.Comments += "\n---\n" + newComment
	} else {
		performance.Comments = newComment
	}

	config.DB.Save(&performance)

	c.JSON(http.StatusOK, gin.H{"message": "Comment added"})
}

// UpdatePerformanceScore - Manager/HR only
func UpdatePerformanceScore(c *gin.Context) {
	id := c.Param("id")
	role := c.GetString("role")

	if role != "manager" && role != "hr" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	var body struct {
		Score float64 `json:"score" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Score required"})
		return
	}

	var performance models.Performance
	if err := config.DB.First(&performance, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Performance not found"})
		return
	}

	performance.Score = body.Score
	config.DB.Save(&performance)

	c.JSON(http.StatusOK, gin.H{"message": "Score updated"})
}
