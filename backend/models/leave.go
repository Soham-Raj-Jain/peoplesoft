package models

import "time"

type Leave struct {
	ID         uint `gorm:"primaryKey"`
	UserID     uint `gorm:"not null;constraint:OnDelete:CASCADE"`
	StartDate  time.Time
	EndDate    time.Time
	Type       string
	Reason     string
	Status     string `gorm:"default:pending"` // pending / approved / rejected
	ApprovedBy *uint  // Nullable - set when approved/rejected
	CreatedAt  time.Time
}
