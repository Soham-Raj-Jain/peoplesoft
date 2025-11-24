package utils

import (
	"fmt"
	"os"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

// ----------------------------
// 1) LOCAL JWT (HS256)
// ----------------------------

type Claims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken creates a JWT for your application
func GenerateToken(email, role string) (string, error) {
	exp := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		Email: email,
		Role:  role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// ValidateToken validates your application's JWT
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ----------------------------
// 2) AUTH0 (RS256) VERIFICATION
// ----------------------------

// Auth0Claims represents claims from Auth0 token
type Auth0Claims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// Global JWKS cache
var jwks *keyfunc.JWKS

// InitAuth0 loads JWKS keys from Auth0
func InitAuth0() error {
	domain := os.Getenv("AUTH0_DOMAIN")
	if domain == "" {
		return fmt.Errorf("AUTH0_DOMAIN missing")
	}

	jwksURL := fmt.Sprintf("https://%s/.well-known/jwks.json", domain)

	var err error
	jwks, err = keyfunc.Get(jwksURL, keyfunc.Options{
		RefreshErrorHandler: func(err error) {
			fmt.Printf("JWKS refresh failed: %v\n", err)
		},
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  time.Minute,
		RefreshTimeout:    10 * time.Second,
		RefreshUnknownKID: true,
	})

	return err
}

// ValidateAuth0Token verifies RS256 ID token from Auth0
func ValidateAuth0Token(tokenString string) (*Auth0Claims, error) {
	if jwks == nil {
		return nil, fmt.Errorf("JWKS not initialized, call InitAuth0() first")
	}

	// Parse token with JWKS
	token, err := jwt.Parse(tokenString, jwks.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid auth0 token")
	}

	// Convert to Auth0Claims struct
	auth0Claims := &Auth0Claims{}

	if sub, ok := claims["sub"].(string); ok {
		auth0Claims.Sub = sub
	}

	if email, ok := claims["email"].(string); ok {
		auth0Claims.Email = email
	} else {
		return nil, fmt.Errorf("email claim not found in token")
	}

	if name, ok := claims["name"].(string); ok {
		auth0Claims.Name = name
	}

	return auth0Claims, nil
}
