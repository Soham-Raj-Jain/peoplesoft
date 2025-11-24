package controllers

import (
	"net/http"

	"peoplesoft/config"
	"peoplesoft/models"
	"peoplesoft/utils"

	"github.com/gin-gonic/gin"
)

func Auth0Login(c *gin.Context) {
	var body struct {
		Email string `json:"email"`
		Name  string `json:"name"`
		Token string `json:"token"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Validate ID token signature (RS256)
	_, err := utils.ValidateAuth0Token(body.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token", "details": err.Error()})
		return
	}

	// Check if user exists
	var user models.User
	config.DB.Where("email = ?", body.Email).First(&user)

	if user.ID == 0 {
		// Create if not exists
		user = models.User{
			Name:         body.Name,
			Email:        body.Email,
			Role:         "employee", // default
			DepartmentID: 1,
		}
		config.DB.Create(&user)
	}

	// Create application JWT
	appToken, _ := utils.GenerateToken(user.Email, user.Role)

	c.JSON(http.StatusOK, gin.H{
		"token": appToken,
		"role":  user.Role,
		"email": user.Email,
	})
}
