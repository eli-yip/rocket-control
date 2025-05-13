package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/eli-yip/rocket-control/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewPostgresDB(c config.DatabaseConfig) (db *gorm.DB, err error) {
	mdsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai",
		c.Host, c.Port, c.User, c.Password, c.Name)
	gormConfig := &gorm.Config{
		PrepareStmt:    true,
		TranslateError: true,
		Logger:         logger.Default,
	}

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold: time.Second,
			LogLevel:      logger.Silent,
			Colorful:      false,
		},
	)
	gormConfig.Logger = newLogger

	if db, err = gorm.Open(postgres.Open(mdsn), gormConfig); err != nil {
		panic(err)
	}

	mdb, _ := db.DB()
	mdb.SetMaxIdleConns(20)
	mdb.SetMaxOpenConns(100)
	mdb.SetConnMaxLifetime(time.Hour)

	return db, nil
}

// --- MissionIface 实现 ---
func (s *MissionService) AddMission(name, user string, duration int, opts ...MissionOptFunc) (*Mission, error) {
	m := &Mission{
		Name:      name,
		CreatedBy: user,
		Duration:  duration,
		Status:    MissionStatusPending,
	}
	for _, opt := range opts {
		opt(m)
	}
	if err := s.Create(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MissionService) UpdateMissionStatus(id uint, status MissionStatus) error {
	return s.Model(&Mission{}).Where("id = ?", id).Update("status", status).Error
}

func (s *MissionService) GetMission(id uint) (*Mission, error) {
	var m Mission
	if err := s.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *MissionService) GetMissionList() ([]*Mission, error) {
	var ms []*Mission
	if err := s.Find(&ms).Error; err != nil {
		return nil, err
	}
	return ms, nil
}

// --- SystemStateIface 实现 ---
func (s *SystemStateService) GetSystemState(missionID uint) (*SystemState, error) {
	var ss SystemState
	if err := s.Where("mission_id = ?", missionID).First(&ss).Error; err != nil {
		return nil, err
	}
	return &ss, nil
}

func (s *SystemStateService) UpdateSystemSetting(missionID uint, setting RocketSetting) error {
	return s.Model(&SystemState{}).Where("mission_id = ?", missionID).Updates(setting).Error
}

func (s *SystemStateService) UpdateSystemStatus(missionID uint, status RocketStatus) error {
	return s.Model(&SystemState{}).Where("mission_id = ?", missionID).Updates(status).Error
}

// --- CustomProgramIface 实现 ---
func (s *CustomProgramService) GetCusomProgram(id uint) (ProgramSteps, error) {
	var cp CustomProgram
	if err := s.First(&cp, id).Error; err != nil {
		return nil, err
	}
	var steps ProgramSteps
	if err := cp.Steps.AssignTo(&steps); err != nil {
		return nil, err
	}
	return steps, nil
}

// --- EventIface 实现 ---
func (s *EventService) AddEvent(missionID uint, eventType EventType, value string, createdBy string) (*Event, error) {
	e := &Event{
		MissionID: missionID,
		Type:      eventType,
		Value:     value,
		CreatedBy: createdBy,
		Status:    EventStatusPending,
	}
	if err := s.Create(e).Error; err != nil {
		return nil, err
	}
	return e, nil
}

func (s *EventService) AddSubEvent(missionID, parentID uint, eventType EventType, value string, createdBy string) (*Event, error) {
	e := &Event{
		MissionID: missionID,
		PartOf:    parentID,
		Type:      eventType,
		Value:     value,
		CreatedBy: createdBy,
		Status:    EventStatusPending,
	}
	if err := s.Create(e).Error; err != nil {
		return nil, err
	}
	return e, nil
}

func (s *EventService) UpdateEventStatus(id uint, status EventStatus) error {
	return s.Model(&Event{}).Where("id = ?", id).Update("status", status).Error
}

// --- AccidentIface 实现 ---
func (s *AccidentService) GetRandomAccident() (ProgramSteps, error) {
	var a Accident
	if err := s.Order("RANDOM()").First(&a).Error; err != nil {
		return nil, err
	}
	var steps ProgramSteps
	if err := a.Steps.AssignTo(&steps); err != nil {
		return nil, err
	}
	return steps, nil
}

// --- 工厂函数，返回所有接口实现 ---
type GormDBService struct {
	*gorm.DB
	*MissionService
	*SystemStateService
	*CustomProgramService
	*EventService
	*AccidentService
}

func NewGormDBService(db *gorm.DB) Iface {
	return &GormDBService{
		DB:                   db,
		MissionService:       &MissionService{db},
		SystemStateService:   &SystemStateService{db},
		CustomProgramService: &CustomProgramService{db},
		EventService:         &EventService{db},
		AccidentService:      &AccidentService{db},
	}
}
