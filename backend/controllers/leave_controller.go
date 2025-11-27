package controllers

import (
	"errors"
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type LeaveResponse struct {
	ID             uint      `json:"id"`
	UserID         uint      `json:"user_id"`
	UserName       string    `json:"user_name"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	Type           string    `json:"type"`
	Reason         string    `json:"reason"`
	Status         string    `json:"status"`
	ApprovedBy     *uint     `json:"approved_by"` // Nullable
	ApprovedByName *string   `json:"approved_by_name"`
	CreatedAt      time.Time `json:"created_at"`
}

type LeaveRequest struct {
	StartDate string `json:"start_date"` // "YYYY-MM-DD"
	EndDate   string `json:"end_date"`   // "YYYY-MM-DD"
	Type      string `json:"type"`
	Reason    string `json:"reason"`
}

// POST /api/leaves
func CreateLeave(c *gin.Context) {
	var req LeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing user id in context"})
		return
	}

	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, expected YYYY-MM-DD"})
		return
	}

	// Disallow dates before today
	today := time.Now().Truncate(24 * time.Hour)
	if start.Before(today) || end.Before(today) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot request leave in the past"})
		return
	}

	// Ensure start <= end
	if end.Before(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end date cannot be before start date"})
		return
	}

	days := workingDaysBetween(start, end)
	if days <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no working days in selected range"})
		return
	}

	leaveType := strings.ToLower(req.Type)
	year := start.Year()

	tx := config.DB.Begin()

	// get or create allocation
	alloc, err := getOrCreateAllocation(userID, year, leaveType)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load allocation"})
		return
	}

	remaining := alloc.Total - alloc.Used
	if days > remaining {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "insufficient balance",
			"remaining":  remaining,
			"requested":  days,
			"leave_type": leaveType,
		})
		return
	}

	// block the days immediately (on apply)
	alloc.Used += days
	if err := tx.Save(alloc).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update allocation"})
		return
	}

	leave := models.Leave{
		UserID:    userID,
		StartDate: start,
		EndDate:   end,
		Type:      leaveType,
		Reason:    req.Reason,
		Status:    "pending",
	}

	if err := tx.Create(&leave).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create leave"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"data": leave})
}

// GET /api/leaves/my
func ListMyLeaves(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing user id"})
		return
	}

	var items []LeaveResponse

	err := config.DB.
		Table("leaves l").
		Select(`
			l.id,
			l.user_id,
			u.name AS user_name,
			l.start_date,
			l.end_date,
			l.type,
			l.reason,
			l.status,
			l.approved_by,
			au.name AS approved_by_name,
			l.created_at
		`).
		Joins("JOIN users u ON u.id = l.user_id").
		Joins("LEFT JOIN users au ON au.id = l.approved_by").
		Where("l.user_id = ?", userID).
		Order("l.created_at DESC").
		Find(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load leaves"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GET /api/leaves/team
// - HR: all employees’ leaves
// - Manager: employees where employees.manager_id = manager userID
// - Employee: colleagues with same manager_id
func ListTeamLeaves(c *gin.Context) {
	role := c.GetString("role")
	userID := c.GetUint("userID")

	var items []LeaveResponse

	q := config.DB.
		Table("leaves l").
		Select(`
			l.id,
			l.user_id,
			u.name AS user_name,
			l.start_date,
			l.end_date,
			l.type,
			l.reason,
			l.status,
			l.approved_by,
			au.name AS approved_by_name,
			l.created_at
		`).
		Joins("JOIN users u ON u.id = l.user_id").
		Joins("LEFT JOIN users au ON au.id = l.approved_by")

	switch role {
	case "hr":
		// HR sees all
		// no extra filter
	case "manager":
		q = q.Joins("JOIN employees e ON e.user_id = l.user_id").
			Where("e.manager_id = ?", userID)
	default:
		// employee – colleagues with same manager (your existing logic)
		// keep your manager lookup code here and add:
		// q = q.Joins("JOIN employees e ON e.user_id = l.user_id").Where("e.manager_id = ?", managerID)
	}

	if err := q.Order("l.created_at DESC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load team leaves"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// PUT /api/leaves/:id/approve
// Only manager can approve
func ApproveLeave(c *gin.Context) {
	role := c.GetString("role")
	approverID := c.GetUint("userID")

	if role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only managers can approve"})
		return
	}

	id := c.Param("id")

	res := config.DB.Model(&models.Leave{}).
		Where("id = ? AND status = ?", id, "pending").
		Updates(map[string]interface{}{
			"status":      "approved",
			"approved_by": approverID,
		})

	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve leave"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "leave not found or not pending"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

// PUT /api/leaves/:id/reject
// Only manager can reject
func RejectLeave(c *gin.Context) {
	role := c.GetString("role")
	approverID := c.GetUint("userID")

	if role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only managers can reject"})
		return
	}

	id := c.Param("id")

	tx := config.DB.Begin()

	var leave models.Leave
	if err := tx. // optional row lock if you use it
			Where("id = ? AND status = ?", id, "pending").
			First(&leave).Error; err != nil {

		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "leave not found or not pending"})
		return
	}

	// compute working days for this leave
	days := workingDaysBetween(leave.StartDate, leave.EndDate)
	year := leave.StartDate.Year()
	alloc, err := getOrCreateAllocation(leave.UserID, year, leave.Type)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load allocation"})
		return
	}

	alloc.Used -= days
	if alloc.Used < 0 {
		alloc.Used = 0
	}

	if err := tx.Save(alloc).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update allocation"})
		return
	}

	if err := tx.Model(&leave).
		Updates(map[string]interface{}{
			"status":      "rejected",
			"approved_by": approverID,
		}).Error; err != nil {

		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update leave"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "rejected"})
}

// business days (Mon–Fri) inclusive
func workingDaysBetween(start, end time.Time) int {
	if end.Before(start) {
		return 0
	}
	d := 0
	cur := start
	for !cur.After(end) {
		wd := cur.Weekday()
		if wd != time.Saturday && wd != time.Sunday {
			d++
		}
		cur = cur.AddDate(0, 0, 1)
	}
	return d
}

// default allocations per type per year
func defaultAllocationForType(t string) int {
	switch strings.ToLower(t) {
	case "sick":
		return 15
	case "casual":
		return 5
	case "vacation":
		return 10
	default:
		return 0
	}
}

func getOrCreateAllocation(userID uint, year int, leaveType string) (*models.LeaveAllocation, error) {
	var alloc models.LeaveAllocation
	err := config.DB.
		Where("user_id = ? AND year = ? AND type = ?", userID, year, leaveType).
		First(&alloc).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		total := defaultAllocationForType(leaveType)
		alloc = models.LeaveAllocation{
			UserID: userID,
			Year:   year,
			Type:   leaveType,
			Total:  total,
			Used:   0,
		}
		if err := config.DB.Create(&alloc).Error; err != nil {
			return nil, err
		}
		return &alloc, nil
	}
	if err != nil {
		return nil, err
	}
	return &alloc, nil
}

type LeaveBalanceResponse struct {
	Type      string `json:"type"`
	Total     int    `json:"total"`
	Used      int    `json:"used"`
	Remaining int    `json:"remaining"`
}

func GetMyLeaveBalance(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing user id"})
		return
	}

	year := time.Now().Year()

	var allocs []models.LeaveAllocation
	if err := config.DB.
		Where("user_id = ? AND year = ?", userID, year).
		Find(&allocs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load allocations"})
		return
	}

	// lazily ensure default allocations exist even if empty
	types := []string{"sick", "casual", "vacation"}
	existing := map[string]*models.LeaveAllocation{}
	for i := range allocs {
		existing[allocs[i].Type] = &allocs[i]
	}

	var result []LeaveBalanceResponse
	for _, t := range types {
		if a, ok := existing[t]; ok {
			result = append(result, LeaveBalanceResponse{
				Type:      t,
				Total:     a.Total,
				Used:      a.Used,
				Remaining: a.Total - a.Used,
			})
		} else {
			total := defaultAllocationForType(t)
			result = append(result, LeaveBalanceResponse{
				Type:      t,
				Total:     total,
				Used:      0,
				Remaining: total,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
