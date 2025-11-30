package controllers

import (
	"net/http"
	"time"

	"peoplesoft/config"
	"peoplesoft/models"

	"github.com/gin-gonic/gin"
)

func mustUser(c *gin.Context) (email, role string, userID uint) {
	email = c.GetString("email")
	role = c.GetString("role")
	id, exists := c.Get("userID")
	if exists {
		userID = id.(uint)
	}
	return
}

/* ========== GOALS WORKFLOW: HR → Manager → Employee ========== */

// POST /api/pms/hr/assign-goals (HR only)
// HR assigns goals to managers
func HRAssignGoalsToManager(c *gin.Context) {
	_, role, userID := mustUser(c)
	if role != "hr" {
		c.JSON(http.StatusForbidden, gin.H{"error": "HR access only"})
		return
	}

	var in struct {
		CycleID     uint   `json:"cycle_id" binding:"required"`
		ManagerID   uint   `json:"manager_id" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Timeline    string `json:"timeline"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Verify manager role
	var managerRole string
	config.DB.Table("users").Select("role").Where("id = ?", in.ManagerID).Scan(&managerRole)
	if managerRole != "manager" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target user is not a manager"})
		return
	}

	g := models.Goal{
		UserID:       in.ManagerID,
		CycleID:      in.CycleID,
		Title:        in.Title,
		Description:  in.Description,
		Timeline:     in.Timeline,
		Status:       "hr_assigned",
		AssignedByID: &userID,
		Level:        "hr_manager",
	}
	if err := config.DB.Create(&g).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": g, "message": "Goal assigned to manager"})
}

// POST /api/pms/manager/assign-goals (Manager only)
// Manager assigns goals to employees
func ManagerAssignGoalsToEmployee(c *gin.Context) {
	_, role, userID := mustUser(c)
	if role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Manager access only"})
		return
	}

	var in struct {
		CycleID     uint   `json:"cycle_id" binding:"required"`
		EmployeeID  uint   `json:"employee_id" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Timeline    string `json:"timeline"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Verify employee reports to this manager
	var emp struct {
		ManagerID uint
	}

	if err := config.DB.Table("employees e").
		Select("e.manager_id").
		Joins("JOIN employees m ON m.id = e.manager_id").
		Where("e.user_id = ? AND m.user_id = ?", in.EmployeeID, userID).
		Scan(&emp).Error; err != nil || emp.ManagerID == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "employee not in your team"})
		return
	}

	g := models.Goal{
		UserID:       in.EmployeeID,
		CycleID:      in.CycleID,
		Title:        in.Title,
		Description:  in.Description,
		Timeline:     in.Timeline,
		Status:       "manager_assigned",
		AssignedByID: &userID,
		Level:        "manager_employee",
	}
	if err := config.DB.Create(&g).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": g, "message": "Goal assigned to employee"})
}

// GET /api/pms/my-assigned-goals
// Get goals assigned to current user
func GetMyAssignedGoals(c *gin.Context) {
	_, role, userID := mustUser(c)
	cycleID := c.Query("cycle_id")

	db := config.DB.Table("goals").Where("user_id = ?", userID)
	
	// Filter by assignment status based on role
	if role == "manager" {
		db = db.Where("status IN (?)", []string{"hr_assigned", "accepted", "in_progress", "submitted", "approved"})
		db = db.Where("level = ?", "hr_manager")
	} else if role == "employee" {
		db = db.Where("status IN (?)", []string{"manager_assigned", "accepted", "in_progress", "submitted", "approved"})
		db = db.Where("level = ?", "manager_employee")
	}

	if cycleID != "" {
		db = db.Where("cycle_id = ?", cycleID)
	}

	var rows []models.Goal
	if err := db.Order("created_at desc").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// POST /api/pms/goals/:id/accept
// Accept assigned goal
func AcceptGoal(c *gin.Context) {
	_, _, userID := mustUser(c)
	id := c.Param("id")

	var goal models.Goal
	if err := config.DB.First(&goal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}

	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your goal"})
		return
	}

	// Update status based on current status
	if goal.Status == "hr_assigned" || goal.Status == "manager_assigned" {
		now := time.Now()
		updates := map[string]interface{}{
			"status":      "accepted",
			"accepted_at": now,
		}
		
		if err := config.DB.Model(&goal).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "goal accepted", "status": "accepted"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot accept goal in current state"})
	}
}

// POST /api/pms/goals/:id/submit
// Submit completed goal for approval
func SubmitGoalForApproval(c *gin.Context) {
	_, _, userID := mustUser(c)
	id := c.Param("id")

	var in struct {
		Progress int    `json:"progress"`
		Comments string `json:"comments"`
	}
	c.ShouldBindJSON(&in)

	var goal models.Goal
	if err := config.DB.First(&goal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}

	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your goal"})
		return
	}

	// Can submit if status is accepted or in_progress
	if goal.Status != "accepted" && goal.Status != "in_progress" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot submit goal in current state"})
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":       "submitted",
		"progress":     in.Progress,
		"submitted_at": now,
	}
	if in.Comments != "" {
		updates["description"] = goal.Description + "\n\n--- Submission Comments ---\n" + in.Comments
	}

	if err := config.DB.Model(&goal).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "goal submitted for approval", "status": "submitted"})
}

// GET /api/pms/pending-approvals
// Get goals pending approval (for Manager/HR)
func GetPendingApprovals(c *gin.Context) {
	_, role, userID := mustUser(c)

	var rows []struct {
		models.Goal
		EmployeeName  string `json:"employee_name"`
		EmployeeEmail string `json:"employee_email"`
	}

	db := config.DB.Table("goals g").
		Select("g.*, u.name as employee_name, u.email as employee_email").
		Joins("JOIN users u ON u.id = g.user_id").
		Where("g.status = ?", "submitted")

	if role == "manager" {
		// Get manager's employee ID first
		var managerEmpID uint
		config.DB.Table("employees").Select("id").Where("user_id = ?", userID).Scan(&managerEmpID)
		
		// Manager sees employee submissions from their team
		db = db.Joins("JOIN employees e ON e.user_id = g.user_id").
			Where("e.manager_id = ? AND g.level = ?", managerEmpID, "manager_employee")
	} else if role == "hr" {
		// HR sees manager submissions
		db = db.Where("g.level = ?", "hr_manager")
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient privileges"})
		return
	}

	if err := db.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// POST /api/pms/reviews/:goal_id/approve
// Manager approves employee goal or HR approves manager goal
func ApproveGoalAndReview(c *gin.Context) {
	_, role, userID := mustUser(c)
	goalID := c.Param("goal_id")

	var in struct {
		Rating   int     `json:"rating" binding:"required"`
		Comments string  `json:"comments"`
		Score    float64 `json:"score"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Rating < 1 || in.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input, rating 1-5 required"})
		return
	}

	var goal models.Goal
	if err := config.DB.First(&goal, goalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}

	// Check if goal is in submitted status
	if goal.Status != "submitted" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "goal must be in submitted status to approve"})
		return
	}

	// Verify correct approver
	if role == "manager" && goal.Level != "manager_employee" {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only approve employee goals"})
		return
	}
	if role == "hr" && goal.Level != "hr_manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only approve manager goals"})
		return
	}

	// Update goal status to approved
	now := time.Now()
	ratingWords := map[int]string{5: "Excellent", 4: "Good", 3: "Satisfactory", 2: "Needs Improvement", 1: "Unsatisfactory"}
	
	updates := map[string]interface{}{
		"status":       "approved",
		"approved_at":  now,
		"rating_value": in.Rating,
		"rating_word":  ratingWords[in.Rating],
	}
	
	if err := config.DB.Model(&goal).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	// Create performance review record
	review := models.ManagerReview{
		EmployeeID: goal.UserID,
		ReviewerID: userID,
		CycleID:    goal.CycleID,
		Rating:     in.Rating,
		Comments:   in.Comments,
		Status:     "final",
		ReviewedAt: time.Now(),
	}
	if err := config.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "review creation failed"})
		return
	}

	// Update performance record if score provided
	if in.Score > 0 {
		var perf models.Performance
		config.DB.Where("employee_id = ?", goal.UserID).First(&perf)
		if perf.ID > 0 {
			perf.Score = in.Score
			perf.Comments = in.Comments
			config.DB.Save(&perf)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "goal approved and review created",
		"status":    "approved",
		"review_id": review.ID,
	})
}

/* ========== REVIEW ENDPOINTS ========== */

// GET /api/pms/reviews-given (for managers/HR to see reviews they created)
func ReviewsGiven(c *gin.Context) {
	_, _, userID := mustUser(c)

	var rows []struct {
		models.ManagerReview
		EmployeeName string `json:"employee_name"`
	}

	db := config.DB.Table("manager_reviews mr").
		Select("mr.*, u.name as employee_name").
		Joins("JOIN users u ON u.id = mr.employee_id").
		Where("mr.reviewer_id = ?", userID).
		Order("mr.reviewed_at desc")

	if err := db.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// GET /api/pms/all-reviews (for HR to see all reviews)
func AllReviews(c *gin.Context) {
	_, role, _ := mustUser(c)
	
	if role != "hr" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "HR access only"})
		return
	}

	var rows []struct {
		models.ManagerReview
		EmployeeName   string `json:"employee_name"`
		ReviewerName   string `json:"reviewer_name"`
	}

	db := config.DB.Table("manager_reviews mr").
		Select("mr.*, u1.name as employee_name, u2.name as reviewer_name").
		Joins("JOIN users u1 ON u1.id = mr.employee_id").
		Joins("JOIN users u2 ON u2.id = mr.reviewer_id").
		Order("mr.reviewed_at desc")

	if err := db.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ========== EMPLOYEE VIEWS ========== */

// GET /api/pms/my-goals
func ListMyGoals(c *gin.Context) {
	_, _, userID := mustUser(c)
	cycleID := c.Query("cycle_id")

	db := config.DB.Table("goals").Where("user_id = ? AND (level = ? OR level IS NULL)", userID, "self")
	if cycleID != "" {
		db = db.Where("cycle_id = ?", cycleID)
	}

	var rows []models.Goal
	if err := db.Order("created_at desc").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// POST /api/pms/goals
func CreateGoal(c *gin.Context) {
	_, _, userID := mustUser(c)

	var in struct {
		CycleID     uint   `json:"cycle_id" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Timeline    string `json:"timeline"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	g := models.Goal{
		UserID:      userID,
		CycleID:     in.CycleID,
		Title:       in.Title,
		Description: in.Description,
		Timeline:    in.Timeline,
		Status:      "draft",
		Level:       "self",
	}
	if err := config.DB.Create(&g).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": g})
}

// PUT /api/pms/goals/:id
func UpdateGoal(c *gin.Context) {
	_, _, userID := mustUser(c)
	id := c.Param("id")

	var in struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		Timeline    *string `json:"timeline"`
		Progress    *int    `json:"progress"`
		Status      *string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	updates := map[string]any{}
	if in.Title != nil {
		updates["title"] = *in.Title
	}
	if in.Description != nil {
		updates["description"] = *in.Description
	}
	if in.Timeline != nil {
		updates["timeline"] = *in.Timeline
	}
	if in.Progress != nil {
		updates["progress"] = *in.Progress
	}
	if in.Status != nil {
		updates["status"] = *in.Status
	}

	tx := config.DB.Model(&models.Goal{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates)

	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// GET /api/pms/manager/goals
func ManagerListEmployeeGoals(c *gin.Context) {
	emp := c.Query("employee_id")
	cycle := c.Query("cycle_id")

	if emp == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "employee_id required"})
		return
	}
	db := config.DB.Table("goals").Where("user_id = ?", emp)
	if cycle != "" {
		db = db.Where("cycle_id = ?", cycle)
	}

	var rows []models.Goal
	if err := db.Order("created_at desc").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ========== REPORTS ========== */

// GET /api/pms/reports/performance
func PerformanceReports(c *gin.Context) {
	_, role, userID := mustUser(c)

	var reports []struct {
		EmployeeID     uint    `json:"employee_id"`
		EmployeeName   string  `json:"employee_name"`
		DepartmentName string  `json:"department_name"`
		CycleID        uint    `json:"cycle_id"`
		AvgRating      float64 `json:"avg_rating"`
		GoalsTotal     int     `json:"goals_total"`
		GoalsCompleted int     `json:"goals_completed"`
		Status         string  `json:"status"`
	}

	db := config.DB.Table("manager_reviews mr").
		Select(`
			mr.employee_id,
			u.name as employee_name,
			COALESCE(d.name, 'N/A') as department_name,
			mr.cycle_id,
			AVG(mr.rating) as avg_rating,
			COUNT(g.id) as goals_total,
			SUM(CASE WHEN g.status = 'approved' THEN 1 ELSE 0 END) as goals_completed,
			MAX(mr.status) as status
		`).
		Joins("JOIN users u ON u.id = mr.employee_id").
		Joins("LEFT JOIN employees e ON e.user_id = u.id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN goals g ON g.user_id = mr.employee_id AND g.cycle_id = mr.cycle_id")

	if role == "manager" {
		// Get manager's employee ID
		var managerEmpID uint
		config.DB.Table("employees").Select("id").Where("user_id = ?", userID).Scan(&managerEmpID)
		
		db = db.Joins("JOIN employees emp ON emp.user_id = mr.employee_id").
			Where("emp.manager_id = ?", managerEmpID)
	} else if role == "employee" {
		db = db.Where("mr.employee_id = ?", userID)
	}

	db = db.Group("mr.employee_id, u.name, d.name, mr.cycle_id")

	if err := db.Scan(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "report failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// GET /api/pms/my-reviews
func MyReviews(c *gin.Context) {
	_, _, userID := mustUser(c)

	var rows []models.ManagerReview
	if err := config.DB.Where("employee_id = ?", userID).
		Order("reviewed_at desc").
		Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ========== SELF ASSESSMENT ========== */

// POST /api/pms/self-assess
func SubmitSelfAssessment(c *gin.Context) {
	_, _, userID := mustUser(c)

	var in struct {
		CycleID  uint   `json:"cycle_id" binding:"required"`
		Comments string `json:"comments"`
		Rating   *int   `json:"rating"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	s := models.SelfAssessment{
		UserID:      userID,
		CycleID:     in.CycleID,
		Comments:    in.Comments,
		Rating:      in.Rating,
		SubmittedAt: time.Now(),
	}

	var existing models.SelfAssessment
	config.DB.Where("user_id = ? AND cycle_id = ?", userID, in.CycleID).First(&existing)
	if existing.ID > 0 {
		s.ID = existing.ID
		config.DB.Model(&existing).Updates(s)
	} else {
		config.DB.Create(&s)
	}

	c.JSON(http.StatusOK, gin.H{"data": s, "message": "self assessment submitted"})
}
