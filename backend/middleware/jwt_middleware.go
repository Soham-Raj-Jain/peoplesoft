package middleware

import (
	"fmt"
	"net/http"
	"os"
	"peoplesoft/config"
	"peoplesoft/models"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// AuthRequired validates JWT token and sets user context
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		fmt.Println("auth is ", auth)

		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			fmt.Println("Token error:", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Look up user by email to get userID
		var user models.User
		if err := config.DB.Where("email = ?", claims.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			c.Abort()
			return
		}

		// Put into context
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("userID", user.ID)

		c.Next()
	}
}

// RoleMiddleware checks if user has one of the allowed roles
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")
		
		// Check if user role is in allowed roles
		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}
		
		// User doesn't have required role
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied. Required role: " + allowedRoles[0],
		})
		c.Abort()
	}
}