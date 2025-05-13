package db

import (
	"time"

	"github.com/jackc/pgx/pgtype"
	"gorm.io/gorm"
)

type MockDB interface {
	MissionIface
	SystemStateIface
	CustomProgramIface
	EventIface
	AccidentIface
}

type baseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}

type MissionIface interface {
	AddMission(name, user string, duration int, opts ...MissionOptFunc) (*Mission, error)
	UpdateMissionStatus(id uint, status MissionStatus) error
	GetMission(id uint) (*Mission, error)
	GetMissionList() ([]*Mission, error)
}

type MissionOptFunc func(m *Mission)

func WithMissionSuccessRate(rate float64) MissionOptFunc {
	return func(m *Mission) { m.SuccessRate = rate }
}

func WithMissionDesc(desc string) MissionOptFunc {
	return func(m *Mission) { m.Desc = desc }
}

type MissionStatus int

const (
	MissionStatusPending MissionStatus = iota
	MissionStatusInProgress
	MissionStatusCompleted
	MissionStatusFailed
	MissionStatusCancelled
)

const DefaultSuccessRate float64 = 98.0

// Mission 表示用户创建的一个任务
type Mission struct {
	baseModel

	Name        string        `gorm:"unique,type:text"` // 任务名称
	Desc        string        `gorm:"type:text"`        // 任务描述
	Status      MissionStatus `gorm:"type:int"`         // 任务状态
	StartTime   time.Time     `gorm:"type:timestamptz"` // 任务开始时间
	EndTime     time.Time     `gorm:"type:timestamptz"` // 任务结束时间
	Duration    int           `gorm:"type:int"`         // 预估任务持续事件（分钟）
	SuccessRate float64       `gorm:"type:float"`       // 任务成功率
	CreatedBy   string        `gorm:"type:text"`        // 创建者
}

type SystemStateIface interface {
	GetSystemState(missionID uint) (*SystemState, error)
	UpdateSystemSetting(missionID uint, setting RocketSetting) (err error)
	UpdateSystemStatus(missionID uint, status RocketStatus) (err error)
}

type SystemState struct {
	baseModel
	MissionID uint `gorm:"index"`
	RocketSetting
	RocketStatus
}

type RocketSetting struct {
	Power bool `gorm:"type:bool"`
	Comms bool `gorm:"type:bool"`
	Nav   bool `gorm:"type:bool"`
	Life  bool `gorm:"type:bool"`

	Thrust      float64 `gorm:"type:float"` // 推力水平
	Altitude    float64 `gorm:"type:float"` // 高度水平
	Fuel        float64 `gorm:"type:float"` // 燃料水平
	Speed       float64 `gorm:"type:float"` // 速度水平
	Temperature float64 `gorm:"type:float"` // 温度水平

	Stabilizer float64 `gorm:"type:float"` // 稳定器水平

	Oxygen     float64 `gorm:"type:float"` // 氧气水平
	Orbit      float64 `gorm:"type:float"` // 轨道水平
	PowerLevel float64 `gorm:"type:float"` // 电量水平
	Pressure   float64 `gorm:"type:float"` // 压力水平
}

type RocketStatus struct {
	Launched bool `gorm:"type:bool"` // 是否发射

	HullLevel        float64 `gorm:"type:float"` // 船体完整性
	FuelLevel        float64 `gorm:"type:float"`
	OxygenLevel      float64 `gorm:"type:float"`
	TemperatureLevel float64 `gorm:"type:float"`
	PressureLevel    float64 `gorm:"type:float"`
}

type SystemPreset struct {
	baseModel
	Name string `gorm:"unique,type:text"` // 预设名称
	Desc string `gorm:"type:text"`        // 预设描述
	RocketSetting
}

type CustomProgramIface interface {
	GetCusomProgram(id uint) (ProgramSteps, error)
}

// 自定义火箭程序的单步操作
type ProgramStep struct {
	EventType EventType `gorm:"type:text" json:"event_type"` // 事件类型
	Value     string    `gorm:"type:text" json:"value"`      // 事件值
	Desc      string    `gorm:"type:text" json:"desc"`       // 事件描述
	Duration  int       `gorm:"type:int" json:"duration"`    // 事件持续时间
}

type ProgramSteps []ProgramStep

type CustomProgram struct {
	baseModel
	IsSystem bool         `gorm:"type:bool"`                        // 是否是系统预设
	Name     string       `gorm:"unique,type:text"`                 // 程序名称
	Desc     string       `gorm:"type:text"`                        // 程序描述
	Steps    pgtype.JSONB `gorm:"type:jsonb;default:'[]';not null"` // 程序步骤
}

type EventIface interface {
	AddEvent(missionID uint, eventType EventType, value string, createdBy string) (*Event, error)
	AddSubEvent(missionID, parentID uint, eventType EventType, value string, createdBy string) (*Event, error)
	UpdateEventStatus(id uint, status EventStatus) error
}

type EventType string

const (
	EventTypeErr EventType = "error"

	EventTypeJoin  EventType = "join"
	EventTypeLeave EventType = "leave"

	EventTypeLanuch EventType = "launch"
	EventTypeAbort  EventType = "abort"
	EventTypeLand   EventType = "land"
	EventTypeTest   EventType = "test"

	EventTypeAccident EventType = "accident"

	EventTypeDiagnoseStart  EventType = "diagnose"
	EventTypeDiagnoseResult EventType = "diagnose_result"
	EventTypeDiagnoseClear  EventType = "clear_diagnose"

	EventTypeCustomAdd   EventType = "custom_add"
	EventTypeCusomCancel EventType = "custom_cancel"

	// 通过影响火箭设置来影响火箭状态的事件
	// 布尔值
	EventTypeTriggerPower EventType = "power"
	EventTypeTriggerComms EventType = "comms"
	EventTypeTriggerNav   EventType = "nav"
	EventTypeTriggerLife  EventType = "life"

	EventTypeThrust     EventType = "thrust"
	EventTypeAlt        EventType = "altitude"
	EventTypeFuel       EventType = "fuel"
	EventTypeSpeed      EventType = "speed"
	EventTypeTemp       EventType = "temperature"
	EventTypeStabilizer EventType = "stabilizer"
	EventTypeOxygen     EventType = "oxygen"
	EventTypeOrbit      EventType = "orbit"
	EventTypePowerLevel EventType = "power_level"
	EventTypePressure   EventType = "pressure"

	// 直接影响火箭状态的事件
	EventTypeHullChange     EventType = "hull_change"
	EventTypeFuelChange     EventType = "fuel_change"
	EventTypeOxygenChange   EventType = "oxygen_change"
	EventTypeTempChange     EventType = "temperature_change"
	EventTypePressureChange EventType = "pressure_change"
)

type EventStatus int

const (
	EventStatusPending EventStatus = iota
	EventStatusInProgress
	EventStatusCompleted
	EventStatusFailed
	EventStatusCancelled
)

type Event struct {
	baseModel
	MissionID uint        `gorm:"index"`
	CreatedBy string      `gorm:"type:text"` // 创建者
	Desc      string      `gorm:"type:text"` // 事件描述
	PartOf    uint        `gorm:"index"`     // 父事件
	Status    EventStatus `gorm:"type:int"`  // 事件状态
	Type      EventType   `gorm:"type:text"`
	Value     string      `gorm:"type:text"`
}

type DiagnosticIface any

type Diagnostic struct{}

type AccidentIface interface {
	GetRandomAccident() (ProgramSteps, error)
}

type Accident struct {
	baseModel
	Name  string       `gorm:"unique,type:text"`                 // 事故名称
	Desc  string       `gorm:"type:text"`                        // 事故描述
	Steps pgtype.JSONB `gorm:"type:jsonb;default:'[]';not null"` // 事故内容
}
