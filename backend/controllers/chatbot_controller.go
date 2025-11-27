package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"peoplesoft/config"
	"peoplesoft/models"

	"github.com/gin-gonic/gin"
)

// GroqRequest represents the request to Groq API
type GroqRequest struct {
	Model    string          `json:"model"`
	Messages []GroqMessage   `json:"messages"`
	Stream   bool            `json:"stream"`
}

// GroqMessage represents a message in the conversation
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GroqResponse represents the response from Groq API
type GroqResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message GroqMessage `json:"message"`
	} `json:"choices"`
}

// ChatbotQueryRequest represents the incoming request from frontend
type ChatbotQueryRequest struct {
	Question string `json:"question" binding:"required"`
}

// ChatbotResponse represents the response to frontend
type ChatbotResponse struct {
	Answer string                 `json:"answer"`
	Action *ChatbotAction         `json:"action,omitempty"`
}

// ChatbotAction represents an action the chatbot wants to perform
type ChatbotAction struct {
	Type   string                 `json:"type"`   // "apply_leave", "cancel_leave", etc.
	Params map[string]interface{} `json:"params"` // action parameters
}

// HandleChatbotQuery processes chatbot queries with role-based data access
func HandleChatbotQuery(c *gin.Context) {
	var req ChatbotQueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// Get user info from context (set by middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "User not authenticated"})
		return
	}

	role := c.GetString("role")

	// Get employee record for this user
	var employee models.Employee
	if err := config.DB.Where("user_id = ?", userID).First(&employee).Error; err != nil {
		c.JSON(404, gin.H{"error": "Employee record not found"})
		return
	}

	// Build context from database based on user's role
	context := buildUserContext(userID.(uint), employee.ID, role)

	// Call Groq API
	answer, err := queryGroqAPI(req.Question, context, role)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to process query: " + err.Error()})
		return
	}

	// Check if response contains an action
	response := ChatbotResponse{Answer: answer}
	if action := parseAction(answer); action != nil {
		// Execute the action
		actionResult, err := executeAction(action, userID.(uint), c)
		if err != nil {
			response.Answer += fmt.Sprintf("\n\n⚠️ Error executing action: %s", err.Error())
		} else {
			response.Action = action
			response.Answer = actionResult // Replace with success message
		}
	}

	c.JSON(200, response)
}

// buildUserContext retrieves relevant data from database based on user role
func buildUserContext(userID uint, employeeID uint, role string) string {
	var context string

	// Debug logging
	fmt.Printf("[CHATBOT] Building context for UserID=%d, EmployeeID=%d, Role=%s\n", userID, employeeID, role)

	// Get user info first
	var user models.User
	config.DB.First(&user, userID)
	fmt.Printf("[CHATBOT] User found: %s (%s)\n", user.Name, user.Email)

	// Get employee info
	var employee models.Employee
	if err := config.DB.Preload("User").First(&employee, employeeID).Error; err == nil {
		context += fmt.Sprintf("Employee Name: %s\n", user.Name)
		context += fmt.Sprintf("Employee ID: %d\n", employee.ID)
		context += fmt.Sprintf("Email: %s\n", user.Email)
		context += fmt.Sprintf("Designation: %s\n", employee.Designation)
		context += fmt.Sprintf("Phone: %s\n", employee.Phone)
		context += fmt.Sprintf("Location: %s\n", employee.Location)

		// Get manager info with ALL details
		if employee.ManagerID != nil {
			var manager models.Employee
			var managerUser models.User
			if err := config.DB.First(&manager, *employee.ManagerID).Error; err == nil {
				config.DB.First(&managerUser, manager.UserID)

				// Get manager's department
				var managerDept models.Department
				var managerDeptName string
				if manager.DepartmentID > 0 {
					if err := config.DB.First(&managerDept, manager.DepartmentID).Error; err == nil {
						managerDeptName = managerDept.Name
					}
				}

				context += fmt.Sprintf("\nManager Information:\n")
				context += fmt.Sprintf("Name: %s\n", managerUser.Name)
				context += fmt.Sprintf("Email: %s\n", managerUser.Email)
				context += fmt.Sprintf("Phone: %s\n", manager.Phone)
				context += fmt.Sprintf("Designation: %s\n", manager.Designation)
				context += fmt.Sprintf("Location: %s\n", manager.Location)
				if managerDeptName != "" {
					context += fmt.Sprintf("Department: %s\n", managerDeptName)
				}
				context += fmt.Sprintf("Employee ID: %d\n", manager.ID)
			}
		}
	}

	// Get HR contact info with ALL details
	var hrUser models.User
	var hrEmployee models.Employee
	if err := config.DB.Where("role = ?", "hr").First(&hrUser).Error; err == nil {
		if err := config.DB.Where("user_id = ?", hrUser.ID).First(&hrEmployee).Error; err == nil {
			// Get HR's department
			var hrDept models.Department
			var hrDeptName string
			if hrEmployee.DepartmentID > 0 {
				if err := config.DB.First(&hrDept, hrEmployee.DepartmentID).Error; err == nil {
					hrDeptName = hrDept.Name
				}
			}

			context += fmt.Sprintf("\nHR Contact:\n")
			context += fmt.Sprintf("Name: %s\n", hrUser.Name)
			context += fmt.Sprintf("Email: %s\n", hrUser.Email)
			context += fmt.Sprintf("Phone: %s\n", hrEmployee.Phone)
			context += fmt.Sprintf("Designation: %s\n", hrEmployee.Designation)
			context += fmt.Sprintf("Location: %s\n", hrEmployee.Location)
			if hrDeptName != "" {
				context += fmt.Sprintf("Department: %s\n", hrDeptName)
			}
			context += fmt.Sprintf("Employee ID: %d\n", hrEmployee.ID)
		}
	}

	// Get leave balances
	var balances []models.LeaveAllocation
	if err := config.DB.Where("user_id = ?", userID).Find(&balances).Error; err == nil {
		fmt.Printf("[CHATBOT] Found %d leave allocations\n", len(balances))
		if len(balances) > 0 {
			context += "\nLeave Balances:\n"
			for _, b := range balances {
				remaining := b.Total - b.Used
				context += fmt.Sprintf("- %s: %d/%d remaining\n", b.Type, remaining, b.Total)
			}
		} else {
			context += "\nLeave Balances: No leave allocations found for this user\n"
		}
	} else {
		fmt.Printf("[CHATBOT] Error fetching leave balances: %v\n", err)
	}

	// Get recent leaves with ALL details
	var leaves []models.Leave
	if err := config.DB.Where("user_id = ?", userID).Order("start_date DESC").Limit(5).Find(&leaves).Error; err == nil {
		fmt.Printf("[CHATBOT] Found %d leave requests\n", len(leaves))
		if len(leaves) > 0 {
			context += "\nRecent Leave Requests:\n"
			for _, l := range leaves {
				// Calculate duration
				duration := l.EndDate.Sub(l.StartDate).Hours()/24 + 1

				context += fmt.Sprintf("- Type: %s\n", l.Type)
				context += fmt.Sprintf("  Dates: %s to %s (%d days)\n",
					l.StartDate.Format("2006-01-02"),
					l.EndDate.Format("2006-01-02"),
					int(duration))
				context += fmt.Sprintf("  Status: %s\n", l.Status)
				if l.Reason != "" {
					context += fmt.Sprintf("  Reason: %s\n", l.Reason)
				}

				// Get approver info if approved
				if l.ApprovedBy != nil && *l.ApprovedBy > 0 {
					var approver models.User
					if err := config.DB.First(&approver, *l.ApprovedBy).Error; err == nil {
						context += fmt.Sprintf("  Approved By: %s\n", approver.Name)
					}
				}

				context += fmt.Sprintf("  Requested On: %s\n", l.CreatedAt.Format("2006-01-02"))
			}
		}
	}

	// Get goals with more details
	var goals []models.Goal
	if err := config.DB.Where("user_id = ?", userID).Find(&goals).Error; err == nil {
		fmt.Printf("[CHATBOT] Found %d goals\n", len(goals))
		if len(goals) > 0 {
			context += "\nCurrent Goals:\n"
			for _, g := range goals {
				context += fmt.Sprintf("- %s\n", g.Title)
				if g.Description != "" {
					context += fmt.Sprintf("  Description: %s\n", g.Description)
				}
				context += fmt.Sprintf("  Progress: %d%%, Status: %s\n", g.Progress, g.Status)
				if g.Timeline != "" {
					context += fmt.Sprintf("  Timeline: %s\n", g.Timeline)
				}
			}
		}
	}

	// Get self assessments
	var selfAssessments []models.SelfAssessment
	if err := config.DB.Where("user_id = ?", userID).Order("submitted_at DESC").Limit(3).Find(&selfAssessments).Error; err == nil {
		fmt.Printf("[CHATBOT] Found %d self assessments\n", len(selfAssessments))
		if len(selfAssessments) > 0 {
			context += "\nRecent Self Assessments:\n"
			for _, sa := range selfAssessments {
				if sa.Rating != nil {
					context += fmt.Sprintf("- Rating: %d/5\n", *sa.Rating)
				}
				if sa.Comments != "" {
					context += fmt.Sprintf("  Comments: %s\n", sa.Comments)
				}
				context += fmt.Sprintf("  Submitted: %s\n", sa.SubmittedAt.Format("2006-01-02"))
			}
		}
	}

	// Get manager reviews
	var managerReviews []models.ManagerReview
	if err := config.DB.Where("employee_id = ?", employeeID).Order("reviewed_at DESC").Limit(3).Find(&managerReviews).Error; err == nil {
		fmt.Printf("[CHATBOT] Found %d manager reviews\n", len(managerReviews))
		if len(managerReviews) > 0 {
			context += "\nRecent Manager Reviews:\n"
			for _, mr := range managerReviews {
				context += fmt.Sprintf("- Rating: %d/5, Status: %s\n", mr.Rating, mr.Status)
				if mr.Comments != "" {
					context += fmt.Sprintf("  Comments: %s\n", mr.Comments)
				}
				if !mr.ReviewedAt.IsZero() {
					context += fmt.Sprintf("  Date: %s\n", mr.ReviewedAt.Format("2006-01-02"))
				}
			}
		}
	}

	// Get department info
	var department models.Department
	if employee.DepartmentID > 0 {
		if err := config.DB.First(&department, employee.DepartmentID).Error; err == nil {
			context += fmt.Sprintf("\nDepartment: %s\n", department.Name)
		}
	}

	// For managers: add comprehensive team information
	if role == "manager" || role == "hr" {
		var teamMembers []models.Employee
		if err := config.DB.Where("manager_id = ?", employeeID).Find(&teamMembers).Error; err == nil && len(teamMembers) > 0 {
			context += fmt.Sprintf("\nTeam Members (%d):\n", len(teamMembers))
			for _, tm := range teamMembers {
				var tmUser models.User
				config.DB.First(&tmUser, tm.UserID)
				context += fmt.Sprintf("- %s\n", tmUser.Name)
				context += fmt.Sprintf("  Designation: %s, Location: %s\n", tm.Designation, tm.Location)
				context += fmt.Sprintf("  Email: %s, Phone: %s\n", tmUser.Email, tm.Phone)

				// Get team member's leave balances
				var tmBalances []models.LeaveAllocation
				if err := config.DB.Where("user_id = ?", tm.UserID).Find(&tmBalances).Error; err == nil && len(tmBalances) > 0 {
					context += "  Leave Balances: "
					for i, b := range tmBalances {
						remaining := b.Total - b.Used
						if i > 0 {
							context += ", "
						}
						context += fmt.Sprintf("%s: %d/%d", b.Type, remaining, b.Total)
					}
					context += "\n"
				}
			}
		}

		// Pending leave approvals - Get user IDs of team members
		var teamUserIDs []uint
		for _, tm := range teamMembers {
			teamUserIDs = append(teamUserIDs, tm.UserID)
		}

		if len(teamUserIDs) > 0 {
			var pendingLeaves []models.Leave
			config.DB.Where("user_id IN ? AND status = ?", teamUserIDs, "pending").Find(&pendingLeaves)

			if len(pendingLeaves) > 0 {
				context += fmt.Sprintf("\nPending Leave Approvals (%d):\n", len(pendingLeaves))
				for _, pl := range pendingLeaves {
					var plUser models.User
					config.DB.First(&plUser, pl.UserID)
					context += fmt.Sprintf("- %s: %s to %s (%s)\n",
						plUser.Name,
						pl.StartDate.Format("2006-01-02"),
						pl.EndDate.Format("2006-01-02"),
						pl.Type)
				}
			}
		}
	}

	// For HR: add company-wide stats
	if role == "hr" {
		var totalEmployees int64
		config.DB.Model(&models.Employee{}).Count(&totalEmployees)
		context += fmt.Sprintf("\nTotal Employees: %d\n", totalEmployees)

		var pendingLeaves int64
		config.DB.Model(&models.Leave{}).Where("status = ?", "pending").Count(&pendingLeaves)
		context += fmt.Sprintf("Pending Leave Requests: %d\n", pendingLeaves)
	}

	fmt.Printf("[CHATBOT] Final context:\n%s\n", context)
	return context
}

// queryGroqAPI sends the query to Groq API and returns the response
func queryGroqAPI(question, context, role string) (string, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" || apiKey == "your-groq-api-key-here" {
		return "⚠️ Groq API key not configured. Please set GROQ_API_KEY in your .env file.\n\nYou can get a free API key from: https://console.groq.com/keys", nil
	}

	// Build system prompt based on role
	systemPrompt := fmt.Sprintf(`You are an intelligent HR assistant for a PeopleSoft HR Management System.
The user is an employee with role: %s.

Here is ALL the available data about the user and their context from the database:
%s

Guidelines:
- Answer ANY question about the data provided above - be comprehensive and intelligent
- Extract and interpret information from the context to answer questions
- For questions about people (managers, HR, team members), provide their contact details if available
- For leave questions, calculate and explain balances, pending requests, and history
- For goal/performance questions, summarize progress and status
- For team questions (if manager/HR), provide detailed team member information
- Be conversational, friendly, and helpful
- If specific data is not in the context, clearly state "I don't have that information in the current data"
- Use bullet points and formatting for better readability
- Answer questions about departments, locations, designations, and any other fields in the data
- Perform calculations if needed (like total days of leave, percentages, etc.)

IMPORTANT - Action Detection:
When the user wants to PERFORM AN ACTION (not just ask a question), you must respond with a special JSON format at the END of your message.
Actions include: applying for leave, canceling leave, updating goals, etc.

If the user wants to apply for leave, your response should END with:
ACTION: {"type":"apply_leave","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","leave_type":"sick/casual/annual","reason":"reason text"}

Examples:
- "I want to apply leave from Dec 25 to Dec 27" -> ACTION: {"type":"apply_leave","start_date":"2025-12-25","end_date":"2025-12-27","leave_type":"casual","reason":""}
- "Apply sick leave for tomorrow" -> ACTION: {"type":"apply_leave","start_date":"2025-11-28","end_date":"2025-11-28","leave_type":"sick","reason":""}

Today's date is 2025-11-27. Use this to calculate relative dates like "tomorrow", "next week", etc.
If leave type is not specified, default to "casual".
If dates are ambiguous, ask for clarification instead of creating an action.
`, role, context)

	// Prepare Groq API request
	groqReq := GroqRequest{
		Model: "llama-3.3-70b-versatile", // Fast and accurate model
		Messages: []GroqMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: question},
		},
		Stream: false,
	}

	jsonData, err := json.Marshal(groqReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	// Make HTTP request to Groq
	req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Groq API: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Groq API error (%d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("no response from Groq")
	}

	return groqResp.Choices[0].Message.Content, nil
}

// parseAction extracts action from AI response
func parseAction(response string) *ChatbotAction {
	// Look for ACTION: {...} pattern in the response
	actionPrefix := "ACTION: "
	idx := strings.Index(response, actionPrefix)
	if idx == -1 {
		return nil
	}

	// Extract JSON part
	jsonStr := response[idx+len(actionPrefix):]
	jsonStr = strings.TrimSpace(jsonStr)

	// Parse the action JSON
	var actionData map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &actionData); err != nil {
		fmt.Printf("[CHATBOT] Failed to parse action JSON: %v\n", err)
		return nil
	}

	actionType, ok := actionData["type"].(string)
	if !ok {
		return nil
	}

	return &ChatbotAction{
		Type:   actionType,
		Params: actionData,
	}
}

// executeAction performs the requested action
func executeAction(action *ChatbotAction, userID uint, c *gin.Context) (string, error) {
	switch action.Type {
	case "apply_leave":
		return applyLeave(action.Params, userID, c)
	default:
		return "", fmt.Errorf("unknown action type: %s", action.Type)
	}
}

// applyLeave creates a leave request
func applyLeave(params map[string]interface{}, userID uint, c *gin.Context) (string, error) {
	// Extract parameters
	startDateStr, ok := params["start_date"].(string)
	if !ok || startDateStr == "" {
		return "", fmt.Errorf("start_date is required")
	}

	endDateStr, ok := params["end_date"].(string)
	if !ok || endDateStr == "" {
		return "", fmt.Errorf("end_date is required")
	}

	leaveType, ok := params["leave_type"].(string)
	if !ok || leaveType == "" {
		leaveType = "casual" // default
	}

	reason := ""
	if r, ok := params["reason"].(string); ok {
		reason = r
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return "", fmt.Errorf("invalid start_date format: %v", err)
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		return "", fmt.Errorf("invalid end_date format: %v", err)
	}

	// Calculate duration
	duration := int(endDate.Sub(startDate).Hours()/24) + 1
	if duration <= 0 {
		return "", fmt.Errorf("end date must be after start date")
	}

	// Check leave balance
	var allocation models.LeaveAllocation
	if err := config.DB.Where("user_id = ? AND type = ?", userID, leaveType).First(&allocation).Error; err != nil {
		return "", fmt.Errorf("no leave allocation found for type: %s", leaveType)
	}

	remaining := allocation.Total - allocation.Used
	if remaining < duration {
		return "", fmt.Errorf("insufficient leave balance. You have %d days of %s leave remaining, but requested %d days", remaining, leaveType, duration)
	}

	// Create leave request
	leave := models.Leave{
		UserID:    userID,
		StartDate: startDate,
		EndDate:   endDate,
		Type:      leaveType,
		Reason:    reason,
		Status:    "pending",
	}

	if err := config.DB.Create(&leave).Error; err != nil {
		return "", fmt.Errorf("failed to create leave request: %v", err)
	}

	// Success message
	successMsg := fmt.Sprintf("✅ Leave request submitted successfully!\n\n"+
		"📅 Dates: %s to %s (%d days)\n"+
		"📝 Type: %s\n"+
		"⏳ Status: Pending approval\n"+
		"💼 Remaining balance: %d/%d days",
		startDate.Format("Jan 02, 2006"),
		endDate.Format("Jan 02, 2006"),
		duration,
		leaveType,
		remaining-duration,
		allocation.Total)

	if reason != "" {
		successMsg += fmt.Sprintf("\n📄 Reason: %s", reason)
	}

	return successMsg, nil
}
