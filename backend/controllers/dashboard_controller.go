package controllers

import (
	"fmt"
	"net/http"
	"peoplesoft/config"
	"time"

	"github.com/gin-gonic/gin"
)

type DashboardStats struct {
	PendingLeaves   int64 `json:"pendingLeaves"`
	UpcomingReviews int64 `json:"upcomingReviews"`
	ActiveGoals     int64 `json:"activeGoals"`
	TeamSize        int64 `json:"teamSize"`
}

type UpcomingEvent struct {
	Date  string `json:"date"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type QuarterlyResults struct {
	Quarter               string  `json:"quarter"`
	Year                  int     `json:"year"`
	AvgPerformance        float64 `json:"avg_performance"`
	GoalsCompleted        int64   `json:"goals_completed"`
	TotalGoals            int64   `json:"total_goals"`
	GoalsCompletedPercent int     `json:"goals_completed_percent"`
	EngagementScore       int     `json:"engagement_score"`
	EngagementTrend       string  `json:"engagement_trend"`
	EngagementChange      int     `json:"engagement_change"`
	ReviewsCompleted      int64   `json:"reviews_completed"`
	ReviewsPending        int64   `json:"reviews_pending"`
}

type TopPerformer struct {
	Name        string  `json:"name"`
	Designation string  `json:"designation"`
	Score       float64 `json:"score"`
}

type RecentActivity struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Details string `json:"details"`
	Time    string `json:"time"`
}

func GetDashboardStats(c *gin.Context) {
	email := c.GetString("email")
	role := c.GetString("role")

	fmt.Printf("\n=== Dashboard Stats Request ===\n")
	fmt.Printf("Email: %s, Role: %s\n", email, role)

	// Get user ID from users table
	var userID uint
	err := config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID).Error
	if err != nil {
		fmt.Printf("Error getting user ID: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}
	fmt.Printf("User ID from users table: %d\n", userID)

	stats := DashboardStats{}

	// For HR role with peoplesoftent.hr@gmail.com, let's count ALL pending leaves
	if role == "hr" {
		// Count all pending leaves in the system
		config.DB.Table("leaves").Where("status = ?", "pending").Count(&stats.PendingLeaves)
		fmt.Printf("HR - Total Pending Leaves in system: %d\n", stats.PendingLeaves)

		// Count all goals (for testing)
		var totalGoals int64
		config.DB.Table("goals").Count(&totalGoals)
		fmt.Printf("HR - Total Goals in system: %d\n", totalGoals)

		// Count all active goals
		config.DB.Table("goals").
			Where("status IN (?)", []string{"in_progress", "in-progress", "pending"}).
			Count(&stats.ActiveGoals)
		fmt.Printf("HR - Active Goals: %d\n", stats.ActiveGoals)

		// Count all performances in progress
		config.DB.Table("performances").
			Where("status IN (?)", []string{"in_progress", "in-progress", "pending"}).
			Count(&stats.UpcomingReviews)
		fmt.Printf("HR - Upcoming Reviews: %d\n", stats.UpcomingReviews)

		// Count all employees
		config.DB.Table("employees").Count(&stats.TeamSize)
		fmt.Printf("HR - Team Size: %d\n", stats.TeamSize)

	} else if role == "manager" {
		// Manager sees their team's data
		config.DB.Table("leaves l").
			Joins("JOIN employees e ON l.user_id = e.user_id").
			Where("e.manager_id = ? AND l.status = ?", userID, "pending").
			Count(&stats.PendingLeaves)
		fmt.Printf("Manager - Pending Leaves: %d\n", stats.PendingLeaves)

		config.DB.Table("goals g").
			Joins("JOIN employees e ON g.user_id = e.user_id").
			Where("e.manager_id = ? AND g.status IN (?)", userID, []string{"in_progress", "in-progress", "pending"}).
			Count(&stats.ActiveGoals)
		fmt.Printf("Manager - Active Goals: %d\n", stats.ActiveGoals)

		config.DB.Table("performances p").
			Joins("JOIN employees e ON p.user_id = e.user_id").
			Where("e.manager_id = ? AND p.status IN (?)", userID, []string{"in_progress", "in-progress", "pending"}).
			Count(&stats.UpcomingReviews)
		fmt.Printf("Manager - Upcoming Reviews: %d\n", stats.UpcomingReviews)

		config.DB.Table("employees").Where("manager_id = ?", userID).Count(&stats.TeamSize)
		fmt.Printf("Manager - Team Size: %d\n", stats.TeamSize)

	} else {
		// Employee sees their own data

		// Active goals = submitted, in_progress, pending (NOT completed or archived)
		config.DB.Table("goals").
			Where("user_id = ? AND status IN (?)", userID, []string{"in_progress", "in-progress", "pending", "submitted"}).
			Count(&stats.ActiveGoals)
		fmt.Printf("✅ Employee - Active Goals: %d\n", stats.ActiveGoals)

		// Rest of the code...
	}

	fmt.Printf("Final Stats: %+v\n", stats)

	// Quarterly Results
	quarterlyResults := getQuarterlyResults(role, userID)
	fmt.Printf("Quarterly Results: %+v\n", quarterlyResults)

	// Top Performers (for manager/HR only)
	var topPerformers []TopPerformer
	if role == "manager" || role == "hr" {
		topPerformers = getTopPerformers(role, userID)
	}

	// Recent activity
	activity := getRecentActivity(role, userID)
	upcomingEvents := getUpcomingEvents()

	response := gin.H{
		"stats":             stats,
		"quarterly_results": quarterlyResults,
		"top_performers":    topPerformers,
		"recent_activity":   activity,
		"upcoming_events":   upcomingEvents,
	}

	fmt.Printf("=== Response Sent ===\n\n")

	c.JSON(http.StatusOK, response)
}

func getQuarterlyResults(role string, userID uint) *QuarterlyResults {
	now := time.Now()
	quarter := (int(now.Month())-1)/3 + 1
	quarterName := ""
	switch quarter {
	case 1:
		quarterName = "Q1"
	case 2:
		quarterName = "Q2"
	case 3:
		quarterName = "Q3"
	case 4:
		quarterName = "Q4"
	}

	results := &QuarterlyResults{
		Quarter: quarterName,
		Year:    now.Year(),
	}

	fmt.Printf("\n=== Calculating Quarterly Results ===\n")
	fmt.Printf("Role: %s, UserID: %d\n", role, userID)

	// For HR, count ALL goals in system
	if role == "hr" {
		// Count goals with status 'completed' OR ('submitted' AND progress = 100)
		err := config.DB.Table("goals").
			Where("status = ? OR (status = ? AND progress = ?)", "completed", "submitted", 100).
			Count(&results.GoalsCompleted).Error

		if err != nil {
			fmt.Printf("❌ Error counting completed goals: %v\n", err)
		} else {
			fmt.Printf("✅ HR - Completed goals: %d\n", results.GoalsCompleted)
		}

		// Count total goals
		config.DB.Table("goals").Count(&results.TotalGoals)

	} else if role == "manager" {
		// Manager sees team goals
		config.DB.Table("goals g").
			Joins("JOIN employees e ON g.user_id = e.user_id").
			Where("e.manager_id = ? AND (g.status = ? OR (g.status = ? AND g.progress = ?))",
				userID, "completed", "submitted", 100).
			Count(&results.GoalsCompleted)

		config.DB.Table("goals g").
			Joins("JOIN employees e ON g.user_id = e.user_id").
			Where("e.manager_id = ?", userID).
			Count(&results.TotalGoals)

	} else {
		// Employee sees their own goals
		config.DB.Table("goals").
			Where("user_id = ? AND (status = ? OR (status = ? AND progress = ?))",
				userID, "completed", "submitted", 100).
			Count(&results.GoalsCompleted)

		config.DB.Table("goals").
			Where("user_id = ?", userID).
			Count(&results.TotalGoals)
	}

	// Calculate percentage
	if results.TotalGoals > 0 {
		results.GoalsCompletedPercent = int((results.GoalsCompleted * 100) / results.TotalGoals)
	}

	fmt.Printf("📊 Completion Rate: %d%%\n", results.GoalsCompletedPercent)

	// Mock engagement data
	results.EngagementScore = 78
	results.EngagementTrend = "up"
	results.EngagementChange = 5

	// Reviews
	if role == "hr" {
		config.DB.Table("performances").Where("status = ?", "completed").Count(&results.ReviewsCompleted)
		config.DB.Table("performances").Where("status != ?", "completed").Count(&results.ReviewsPending)
	} else if role == "manager" {
		config.DB.Table("performances p").
			Joins("JOIN employees e ON p.user_id = e.user_id").
			Where("e.manager_id = ? AND p.status = ?", userID, "completed").
			Count(&results.ReviewsCompleted)

		config.DB.Table("performances p").
			Joins("JOIN employees e ON p.user_id = e.user_id").
			Where("e.manager_id = ? AND p.status != ?", userID, "completed").
			Count(&results.ReviewsPending)
	} else {
		config.DB.Table("performances").Where("employee_id = ? AND status = ?", userID, "completed").Count(&results.ReviewsCompleted)
		config.DB.Table("performances").Where("employee_id = ? AND status != ?", userID, "completed").Count(&results.ReviewsPending)
	}

	fmt.Printf("🎯 Final Results: Quarter=%s, Year=%d, Completed=%d, Total=%d, Percent=%d%%\n",
		results.Quarter, results.Year, results.GoalsCompleted, results.TotalGoals, results.GoalsCompletedPercent)
	fmt.Printf("=== End Quarterly Results ===\n\n")

	return results
}

func getTopPerformers(role string, userID uint) []TopPerformer {
	var performers []TopPerformer
	// Mock data for now
	return performers
}

func getRecentActivity(role string, userID uint) []RecentActivity {
	activities := []RecentActivity{
		{
			Type:    "leave",
			Message: "Leave request submitted",
			Details: "2 Days - Pending",
			Time:    "2 hours ago",
		},
		{
			Type:    "review",
			Message: "Performance review available",
			Details: "Q4 2024",
			Time:    "1 day ago",
		},
	}
	return activities
}

func getUpcomingEvents() []UpcomingEvent {
	return []UpcomingEvent{
		{
			Date:  "25 DEC",
			Title: "Christmas Day",
			Desc:  "Company Holiday - Office Closed",
		},
		{
			Date:  "01 JAN",
			Title: "New Year's Day",
			Desc:  "Company Holiday - Office Closed",
		},
	}
}
