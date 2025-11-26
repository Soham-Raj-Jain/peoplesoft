package models

type LeaveAllocation struct {
	ID     uint   `gorm:"primaryKey"`
	UserID uint   `gorm:"not null;index"`
	Year   int    `gorm:"not null;index"`
	Type   string `gorm:"not null"` // e.g. "sick", "casual"
	Total  int    `gorm:"not null"` // total days allocated for the year
	Used   int    `gorm:"not null"` // days already used (or blocked by pending)
}
