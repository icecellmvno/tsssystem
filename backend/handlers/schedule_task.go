package handlers

import (
	"strconv"
	"time"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/websocket"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ScheduleTaskHandler struct {
	wsServer *websocket.WebSocketServer
}

func NewScheduleTaskHandler(wsServer *websocket.WebSocketServer) *ScheduleTaskHandler {
	return &ScheduleTaskHandler{
		wsServer: wsServer,
	}
}

// CreateScheduleTask creates a new schedule task
func (h *ScheduleTaskHandler) CreateScheduleTask(c *fiber.Ctx) error {
	var task models.ScheduleTask
	if err := c.BodyParser(&task); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if task.Name == "" || task.DeviceGroupID == 0 || task.Command == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name, device group ID, and command are required",
		})
	}

	// Validate task type
	if task.TaskType != "ussd" && task.TaskType != "sms" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Task type must be either 'ussd' or 'sms'",
		})
	}

	// Validate frequency
	validFrequencies := []string{"hourly", "daily", "weekly", "monthly", "custom"}
	frequencyValid := false
	for _, freq := range validFrequencies {
		if task.Frequency == freq {
			frequencyValid = true
			break
		}
	}
	if !frequencyValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid frequency value",
		})
	}

	// Set default values
	if task.Status == "" {
		task.Status = "active"
	}
	if task.MaxRetries == 0 {
		task.MaxRetries = 3
	}
	if task.RetryDelayMinutes == 0 {
		task.RetryDelayMinutes = 5
	}

	// Calculate next execution time
	h.calculateNextExecutionTime(&task)

	// Create the task
	if err := database.DB.Create(&task).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create schedule task",
		})
	}

	// Load device group data
	database.DB.Preload("DeviceGroup").First(&task, task.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Schedule task created successfully",
		"data":    task,
	})
}

// GetAllScheduleTasks retrieves all schedule tasks with pagination and filtering
func (h *ScheduleTaskHandler) GetAllScheduleTasks(c *fiber.Ctx) error {
	var tasks []models.ScheduleTask
	var total int64

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search")
	taskType := c.Query("task_type")
	frequency := c.Query("frequency")
	status := c.Query("status")
	isActive := c.Query("is_active")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Build query
	query := database.DB.Model(&models.ScheduleTask{}).Preload("DeviceGroup")

	// Apply filters
	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ? OR command LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if taskType != "" && taskType != "all" {
		query = query.Where("task_type = ?", taskType)
	}
	if frequency != "" && frequency != "all" {
		query = query.Where("frequency = ?", frequency)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if isActive != "" && isActive != "all" {
		active, _ := strconv.ParseBool(isActive)
		query = query.Where("is_active = ?", active)
	}

	// Get total count
	query.Count(&total)

	// Apply sorting
	if sortOrder == "asc" {
		query = query.Order(sortBy + " ASC")
	} else {
		query = query.Order(sortBy + " DESC")
	}

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	if err := query.Find(&tasks).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule tasks",
		})
	}

	// Enhance tasks with additional data
	enhancedTasks := h.enhanceTasksWithAdditionalData(tasks)

	return c.JSON(fiber.Map{
		"data":         enhancedTasks,
		"current_page": page,
		"last_page":    (int(total) + perPage - 1) / perPage,
		"per_page":     perPage,
		"total":        total,
		"from":         offset + 1,
		"to":           offset + len(tasks),
	})
}

// GetScheduleTaskByID retrieves a specific schedule task
func (h *ScheduleTaskHandler) GetScheduleTaskByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask

	if err := database.DB.Preload("DeviceGroup").First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	// Enhance task with additional data
	enhancedTask := h.enhanceTaskWithAdditionalData(task)

	return c.JSON(fiber.Map{
		"data": enhancedTask,
	})
}

// UpdateScheduleTask updates an existing schedule task
func (h *ScheduleTaskHandler) UpdateScheduleTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask
	var existingTask models.ScheduleTask

	// Check if task exists
	if err := database.DB.First(&existingTask, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	// Parse request body
	if err := c.BodyParser(&task); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if task.Name == "" || task.DeviceGroupID == 0 || task.Command == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name, device group ID, and command are required",
		})
	}

	// Calculate next execution time if frequency or time changed
	if existingTask.Frequency != task.Frequency || existingTask.Time != task.Time {
		h.calculateNextExecutionTime(&task)
	}

	// Update the task
	if err := database.DB.Model(&existingTask).Updates(task).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update schedule task",
		})
	}

	// Load updated task with relations
	database.DB.Preload("DeviceGroup").First(&task, id)

	return c.JSON(fiber.Map{
		"message": "Schedule task updated successfully",
		"data":    task,
	})
}

// DeleteScheduleTask deletes a schedule task
func (h *ScheduleTaskHandler) DeleteScheduleTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask

	if err := database.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	if err := database.DB.Delete(&task).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete schedule task",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Schedule task deleted successfully",
	})
}

// ExecuteScheduleTask manually executes a schedule task
func (h *ScheduleTaskHandler) ExecuteScheduleTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask

	if err := database.DB.Preload("DeviceGroup").First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	if !task.IsActive {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot execute inactive schedule task",
		})
	}

	// Execute the task
	go h.executeTask(&task)

	return c.JSON(fiber.Map{
		"message": "Schedule task execution started",
	})
}

// PauseScheduleTask pauses a schedule task
func (h *ScheduleTaskHandler) PauseScheduleTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask

	if err := database.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	if task.Status != "active" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Task is not active",
		})
	}

	if err := database.DB.Model(&task).Update("status", "paused").Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to pause schedule task",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Schedule task paused successfully",
	})
}

// ResumeScheduleTask resumes a paused schedule task
func (h *ScheduleTaskHandler) ResumeScheduleTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var task models.ScheduleTask

	if err := database.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule task not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve schedule task",
		})
	}

	if task.Status != "paused" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Task is not paused",
		})
	}

	// Calculate next execution time
	h.calculateNextExecutionTime(&task)

	if err := database.DB.Model(&task).Updates(map[string]interface{}{
		"status":            "active",
		"next_execution_at": task.NextExecutionAt,
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to resume schedule task",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Schedule task resumed successfully",
	})
}

// Helper functions

func (h *ScheduleTaskHandler) calculateNextExecutionTime(task *models.ScheduleTask) {
	now := time.Now()
	var nextTime time.Time

	switch task.Frequency {
	case "hourly":
		nextTime = now.Add(1 * time.Hour)
	case "daily":
		// Parse time string (HH:MM format)
		if t, err := time.Parse("15:04", task.Time); err == nil {
			nextTime = time.Date(now.Year(), now.Month(), now.Day(), t.Hour(), t.Minute(), 0, 0, now.Location())
			if nextTime.Before(now) {
				nextTime = nextTime.Add(24 * time.Hour)
			}
		} else {
			nextTime = now.Add(24 * time.Hour)
		}
	case "weekly":
		if task.DayOfWeek != nil {
			daysUntilNext := (int(*task.DayOfWeek) - int(now.Weekday()) + 7) % 7
			if daysUntilNext == 0 {
				daysUntilNext = 7
			}
			nextTime = time.Date(now.Year(), now.Month(), now.Day()+daysUntilNext, 0, 0, 0, 0, now.Location())
		} else {
			nextTime = now.Add(7 * 24 * time.Hour)
		}
	case "monthly":
		if task.DayOfMonth != nil {
			nextTime = time.Date(now.Year(), now.Month(), *task.DayOfMonth, 0, 0, 0, 0, now.Location())
			if nextTime.Before(now) {
				nextTime = nextTime.AddDate(0, 1, 0)
			}
		} else {
			nextTime = now.AddDate(0, 1, 0)
		}
	case "custom":
		if task.IntervalMinutes != nil {
			nextTime = now.Add(time.Duration(*task.IntervalMinutes) * time.Minute)
		} else {
			nextTime = now.Add(1 * time.Hour)
		}
	default:
		nextTime = now.Add(1 * time.Hour)
	}

	task.NextExecutionAt = &nextTime
}

func (h *ScheduleTaskHandler) enhanceTasksWithAdditionalData(tasks []models.ScheduleTask) []map[string]interface{} {
	enhancedTasks := make([]map[string]interface{}, len(tasks))

	for i, task := range tasks {
		enhancedTasks[i] = h.enhanceTaskWithAdditionalData(task)
	}

	return enhancedTasks
}

func (h *ScheduleTaskHandler) enhanceTaskWithAdditionalData(task models.ScheduleTask) map[string]interface{} {
	// Calculate success rate
	successRate := 0.0
	if task.ExecutionCount > 0 {
		successRate = float64(task.SuccessCount) / float64(task.ExecutionCount) * 100
	}

	// Determine badge variants
	statusBadgeVariant := "secondary"
	switch task.Status {
	case "active":
		statusBadgeVariant = "default"
	case "paused":
		statusBadgeVariant = "secondary"
	case "completed":
		statusBadgeVariant = "outline"
	case "failed":
		statusBadgeVariant = "destructive"
	}

	taskTypeBadgeVariant := "secondary"
	switch task.TaskType {
	case "ussd":
		taskTypeBadgeVariant = "default"
	case "sms":
		taskTypeBadgeVariant = "outline"
	}

	frequencyBadgeVariant := "secondary"
	switch task.Frequency {
	case "hourly":
		frequencyBadgeVariant = "default"
	case "daily":
		frequencyBadgeVariant = "outline"
	case "weekly":
		frequencyBadgeVariant = "secondary"
	case "monthly":
		frequencyBadgeVariant = "outline"
	case "custom":
		frequencyBadgeVariant = "destructive"
	}

	// Generate human readable frequency
	humanReadableFrequency := h.generateHumanReadableFrequency(task)

	// Determine action permissions
	canExecute := task.IsActive && task.Status == "active"
	canPause := task.Status == "active"
	canResume := task.Status == "paused"

	return map[string]interface{}{
		"id":                       task.ID,
		"name":                     task.Name,
		"description":              task.Description,
		"device_group_id":          task.DeviceGroupID,
		"task_type":                task.TaskType,
		"command":                  task.Command,
		"recipient":                task.Recipient,
		"frequency":                task.Frequency,
		"cron_expression":          task.CronExpression,
		"time":                     task.Time,
		"day_of_week":              task.DayOfWeek,
		"day_of_month":             task.DayOfMonth,
		"month":                    task.Month,
		"interval_minutes":         task.IntervalMinutes,
		"is_active":                task.IsActive,
		"dual_sim_support":         task.DualSimSupport,
		"fallback_to_single_sim":   task.FallbackToSingleSim,
		"max_retries":              task.MaxRetries,
		"retry_delay_minutes":      task.RetryDelayMinutes,
		"status":                   task.Status,
		"last_executed_at":         task.LastExecutedAt,
		"next_execution_at":        task.NextExecutionAt,
		"execution_count":          task.ExecutionCount,
		"success_count":            task.SuccessCount,
		"failure_count":            task.FailureCount,
		"last_error":               task.LastError,
		"created_at":               task.CreatedAt,
		"updated_at":               task.UpdatedAt,
		"status_badge_variant":     statusBadgeVariant,
		"task_type_badge_variant":  taskTypeBadgeVariant,
		"frequency_badge_variant":  frequencyBadgeVariant,
		"human_readable_frequency": humanReadableFrequency,
		"success_rate":             successRate,
		"can_execute":              canExecute,
		"can_pause":                canPause,
		"can_resume":               canResume,
		"device_group_data":        task.DeviceGroup,
	}
}

func (h *ScheduleTaskHandler) generateHumanReadableFrequency(task models.ScheduleTask) string {
	switch task.Frequency {
	case "hourly":
		return "Every hour"
	case "daily":
		return "Daily at " + task.Time
	case "weekly":
		if task.DayOfWeek != nil {
			days := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
			return "Weekly on " + days[*task.DayOfWeek]
		}
		return "Weekly"
	case "monthly":
		if task.DayOfMonth != nil {
			return "Monthly on day " + strconv.Itoa(*task.DayOfMonth)
		}
		return "Monthly"
	case "custom":
		if task.IntervalMinutes != nil {
			return "Every " + strconv.Itoa(*task.IntervalMinutes) + " minutes"
		}
		return "Custom"
	default:
		return "Unknown"
	}
}

func (h *ScheduleTaskHandler) executeTask(task *models.ScheduleTask) {
	// This is a placeholder for the actual task execution logic
	// In a real implementation, this would:
	// 1. Get devices from the device group
	// 2. Send USSD/SMS commands to each device
	// 3. Track execution status
	// 4. Update task statistics

	// For now, just update the last executed time
	now := time.Now()
	database.DB.Model(task).Updates(map[string]interface{}{
		"last_executed_at": &now,
		"execution_count":  task.ExecutionCount + 1,
	})

	// Calculate next execution time
	h.calculateNextExecutionTime(task)
	database.DB.Model(task).Update("next_execution_at", task.NextExecutionAt)
}
