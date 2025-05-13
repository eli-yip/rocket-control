package mission

import (
	"fmt"
	"math"
	"math/rand/v2"
	"strconv"
	"sync"
	"time"

	"github.com/eli-yip/rocket-control/db"
	"github.com/eli-yip/rocket-control/log"
	"github.com/eli-yip/rocket-control/models"

	"go.uber.org/zap"
)

type SingleMissionService struct {
	db            db.MockDB
	info          *db.Mission
	settings      *db.RocketSetting
	status        *db.RocketStatus
	lock          sync.Mutex
	members       map[string]chan models.WsMessage
	events        chan models.Event
	accidentEvent chan models.Event
	logger        *zap.Logger
	done          chan struct{}
}

const eventBufferSize = 1000

func NewSingleMissionService(db db.MockDB, missionID uint) (sms *SingleMissionService, err error) {
	mission, err := db.GetMission(missionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get mission: %w", err)
	}

	systemState, err := db.GetSystemState(missionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get system state: %w", err)
	}

	sms = &SingleMissionService{
		db:       db,
		info:     mission,
		settings: &systemState.RocketSetting,
		status:   &systemState.RocketStatus,
		lock:     sync.Mutex{},
		members:  make(map[string]chan models.WsMessage),
		events:   make(chan models.Event, eventBufferSize),
		logger:   log.DefaultLogger.With(zap.Uint("mission", mission.ID)),
	}

	return sms, nil
}

func (s *SingleMissionService) JoinMission(user string) (<-chan models.WsMessage, error) {
	s.lock.Lock()
	defer s.lock.Unlock()

	if _, exists := s.members[user]; exists {
		return nil, fmt.Errorf("user %s already joined", user)
	}

	ch := make(chan models.WsMessage, eventBufferSize)
	s.members[user] = ch

	if len(s.members) == 1 {
		s.logger.Info("first user joined, starting mission service")
		go s.process()
		go s.adjustStatus()
		go s.telemetry()
		go s.accident()
		go s.processAccident()
	}

	joinEvent := models.Event{
		EventType: db.EventTypeJoin,
		CreatedBy: user,
		Value:     user,
	}

	go s.AddEvent(joinEvent)

	return ch, nil
}

func (s *SingleMissionService) LeaveMission(user string) (err error) {
	s.lock.Lock()
	defer s.lock.Unlock()

	if _, exists := s.members[user]; !exists {
		return fmt.Errorf("user %s not found", user)
	}

	leaveEvent := models.Event{
		EventType: db.EventTypeLeave,
		CreatedBy: user,
		Value:     user,
	}

	go s.AddEvent(leaveEvent)

	close(s.members[user])
	delete(s.members, user)

	if len(s.members) == 0 {
		s.logger.Info("all users left, stopping mission service")
		s.done <- struct{}{}
	}

	return nil
}

func (s *SingleMissionService) GetCommChannel(user string) (<-chan models.WsMessage, error) {
	s.lock.Lock()
	defer s.lock.Unlock()

	ch, exists := s.members[user]
	if !exists {
		return nil, fmt.Errorf("user %s not found", user)
	}
	return ch, nil
}

func (s *SingleMissionService) AddEvent(event models.Event) {
	event.Status = db.EventStatusPending
	e, err := s.db.AddEvent(s.info.ID, event.EventType, event.Value, event.CreatedBy)
	if err != nil {
		s.logger.Error("failed to add event", zap.Error(err))
		errEvent := models.Event{
			EventType: event.EventType,
			Status:    db.EventStatusFailed,
			CreatedBy: event.CreatedBy,
			Value:     event.Value,
		}
		s.events <- errEvent
		s.broadcast(errEvent) // 广播失败事件
		return
	}
	event.ID = e.ID
	s.events <- event
}

func (s *SingleMissionService) process() {
	// TODO: 记录前端发来事件的时间戳，在一定时间范围内重新计算事件先后再执行
	for {
		select {
		case <-s.done:
			s.logger.Info("mission service stopped")
			return
		case event := <-s.events:
			switch event.EventType {
			case db.EventTypeCustomAdd:
				s.processComplexEvent(event)
			default:
				s.processNormalEvent(event)
			}
		}
	}
}

func (s *SingleMissionService) processComplexEvent(event models.Event) {
	logger := s.logger.With(zap.Uint("e_id", event.ID))
	logger.Info("processing custom event", zap.String("event_type", string(event.EventType)), zap.String("value", event.Value))
	steps, err := s.db.GetCusomProgram(event.ID)
	if err != nil {
		event.Status = db.EventStatusFailed
		s.logger.Error("failed to get custom program", zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		go s.broadcast(event)
		return
	}

	for range steps {
		// TODO: 处理自定义程序的每一步
	}
}

func (s *SingleMissionService) processNormalEvent(event models.Event) {
	logger := s.logger.With(zap.Uint("e_id", event.ID))
	logger.Info("processing event", zap.String("event_type", string(event.EventType)), zap.String("value", event.Value))
	var handled bool
	switch event.EventType {
	case db.EventTypeJoin, db.EventTypeLeave:
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
		s.broadcast(event)
		handled = true

	case db.EventTypeLanuch:
		handled = true
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusInProgress)
		for i := 10; i >= 1; i-- {
			val := strconv.Itoa(i)
			s.broadcast(models.Event{
				ID:        event.ID,
				EventType: db.EventTypeLanuch,
				Status:    db.EventStatusInProgress,
				Value:     val,
				CreatedBy: event.CreatedBy,
			})
			time.Sleep(1 * time.Second)
		}
		// 发射成功，更新状态
		s.lock.Lock()
		s.status.Launched = true
		_ = s.db.UpdateSystemStatus(s.info.ID, *s.status)
		s.lock.Unlock()
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
		s.broadcast(event)

	case db.EventTypeErr:

	case db.EventTypeAbort:
	case db.EventTypeLand:
	case db.EventTypeTest:

	case db.EventTypeDiagnoseStart:
	case db.EventTypeDiagnoseClear:

	case db.EventTypeCusomCancel:

	// Rocket setting events
	case db.EventTypeThrust, db.EventTypeAlt, db.EventTypeFuel, db.EventTypeSpeed, db.EventTypeTemp,
		db.EventTypeStabilizer, db.EventTypeOxygen, db.EventTypeOrbit, db.EventTypePowerLevel, db.EventTypePressure:
		s.handleRocketSettingEvent(event, logger)
		handled = true

	case db.EventTypeTriggerPower, db.EventTypeTriggerComms, db.EventTypeTriggerNav, db.EventTypeTriggerLife:
		s.handleRocketBoolSettingEvent(event, logger)
		handled = true

	// 直接影响火箭状态的事件
	case db.EventTypeHullChange, db.EventTypeFuelChange, db.EventTypeOxygenChange, db.EventTypeTempChange, db.EventTypePressureChange:
		s.handleRocketStatusEvent(event, logger)
		handled = true
	}

	// 若未被特殊处理，标记为已完成
	if !handled {
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
	}
}

// handleRocketSettingEvent updates rocket settings, saves to db, and broadcasts.
func (s *SingleMissionService) handleRocketSettingEvent(event models.Event, logger *zap.Logger) {
	s.lock.Lock()
	defer s.lock.Unlock()

	val, err := parseEventValueToFloat(event.Value)
	if err != nil {
		logger.Warn("invalid value for rocket setting event", zap.String("value", event.Value), zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	switch event.EventType {
	case db.EventTypeThrust:
		s.settings.Thrust = val
	case db.EventTypeAlt:
		s.settings.Altitude = val
	case db.EventTypeFuel:
		s.settings.Fuel = val
	case db.EventTypeSpeed:
		s.settings.Speed = val
	case db.EventTypeTemp:
		s.settings.Temperature = val
	case db.EventTypeStabilizer:
		s.settings.Stabilizer = val
	case db.EventTypeOxygen:
		s.settings.Oxygen = val
	case db.EventTypeOrbit:
		s.settings.Orbit = val
	case db.EventTypePowerLevel:
		s.settings.PowerLevel = val
	case db.EventTypePressure:
		s.settings.Pressure = val
	}

	// Save updated settings to db
	if err := s.db.UpdateSystemSetting(s.info.ID, *s.settings); err != nil {
		logger.Error("failed to update rocket settings in db", zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
	// Broadcast the event to all members
	s.broadcast(event)
}

func (s *SingleMissionService) handleRocketBoolSettingEvent(event models.Event, logger *zap.Logger) {
	s.lock.Lock()
	defer s.lock.Unlock()

	val, err := strconv.ParseBool(event.Value)
	if err != nil {
		logger.Warn("invalid value for rocket bool setting event", zap.String("value", event.Value), zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	switch event.EventType {
	case db.EventTypeTriggerPower:
		s.settings.Power = val
	case db.EventTypeTriggerComms:
		s.settings.Comms = val
	case db.EventTypeTriggerNav:
		s.settings.Nav = val
	case db.EventTypeTriggerLife:
		s.settings.Life = val
	}

	// Save updated settings to db
	if err := s.db.UpdateSystemSetting(s.info.ID, *s.settings); err != nil {
		logger.Error("failed to update rocket bool settings in db", zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
	// Broadcast the event to all members
	s.broadcast(event)
}

func (s *SingleMissionService) handleRocketStatusEvent(event models.Event, logger *zap.Logger) {
	s.lock.Lock()
	defer s.lock.Unlock()

	val, err := parseEventValueToFloat(event.Value)
	if err != nil {
		logger.Warn("invalid value for rocket status event", zap.String("value", event.Value), zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	switch event.EventType {
	case db.EventTypeHullChange:
		s.status.HullLevel = val
	case db.EventTypeFuelChange:
		s.status.FuelLevel = val
	case db.EventTypeOxygenChange:
		s.status.OxygenLevel = val
	case db.EventTypeTempChange:
		s.status.TemperatureLevel = val
	case db.EventTypePressureChange:
		s.status.PressureLevel = val
	}

	if err := s.db.UpdateSystemStatus(s.info.ID, *s.status); err != nil {
		logger.Error("failed to update rocket settings in db", zap.Error(err))
		_ = s.db.UpdateEventStatus(event.ID, db.EventStatusFailed)
		s.broadcast(event) // 广播失败事件
		return
	}

	_ = s.db.UpdateEventStatus(event.ID, db.EventStatusCompleted)
	s.broadcast(event)
}

// parseEventValueToFloat parses the event value string to float64.
func parseEventValueToFloat(val string) (float64, error) {
	return strconv.ParseFloat(val, 64)
}

func (s *SingleMissionService) broadcast(event models.Event) {
	for id, ch := range s.members {
		select {
		case ch <- event.ToWsMessage("event processed"):
		default:
			s.logger.Warn("failed to send event to user", zap.String("user", id), zap.Error(fmt.Errorf("channel is full")))
		}
	}
}

func (s *SingleMissionService) adjustStatus() {
	s.logger.Info("adjust status started")

	ticker := time.NewTicker(1 * time.Second) // 调整为 1 秒，便于观察
	defer ticker.Stop()

	// 阈值定义
	const (
		hullMin     = 20.0
		fuelMin     = 10.0
		oxygenMin   = 10.0
		tempMax     = 90.0
		pressureMin = 15.0
		pressureMax = 95.0
	)

	for {
		select {
		case <-ticker.C:
			s.lock.Lock()
			// 记录旧值用于判断是否突破阈值
			oldStatus := *s.status

			// 1. 根据 settings 调整 status
			// HullLevel 缓慢下降
			s.status.HullLevel -= 0.05
			if s.status.HullLevel < 0 {
				s.status.HullLevel = 0
			}
			// FuelLevel 消耗与 Thrust 相关
			s.status.FuelLevel -= 0.1 + 0.2*s.settings.Thrust/100
			if s.status.FuelLevel < 0 {
				s.status.FuelLevel = 0
			}
			// OxygenLevel 消耗与 Life 支持和 Thrust 相关
			oxygenRate := 0.05
			if s.settings.Life {
				oxygenRate += 0.05
			}
			oxygenRate += 0.1 * s.settings.Thrust / 100
			s.status.OxygenLevel -= oxygenRate
			if s.status.OxygenLevel < 0 {
				s.status.OxygenLevel = 0
			}
			// 温度与 Thrust 和 PowerLevel 相关
			tempDelta := 0.05*s.settings.Thrust + 0.03*s.settings.PowerLevel
			s.status.TemperatureLevel += tempDelta - 0.1 // 有一定冷却
			if s.status.TemperatureLevel < 0 {
				s.status.TemperatureLevel = 0
			}
			// 压力与 Altitude 和 Fuel 相关
			pressureDelta := 0.05*s.settings.Altitude - 0.03*s.settings.Fuel
			s.status.PressureLevel += pressureDelta
			if s.status.PressureLevel < 0 {
				s.status.PressureLevel = 0
			}

			// 2. 写入数据库
			if err := s.db.UpdateSystemStatus(s.info.ID, *s.status); err != nil {
				s.logger.Error("failed to update rocket status in db", zap.Error(err))
			}

			// 3. 变化后发送 event 到前端
			// 只要有变化就发送
			statusEvents := []struct {
				typ   db.EventType
				val   float64
				field string
			}{
				{db.EventTypeHullChange, s.status.HullLevel, "HullLevel"},
				{db.EventTypeFuelChange, s.status.FuelLevel, "FuelLevel"},
				{db.EventTypeOxygenChange, s.status.OxygenLevel, "OxygenLevel"},
				{db.EventTypeTempChange, s.status.TemperatureLevel, "TemperatureLevel"},
				{db.EventTypePressureChange, s.status.PressureLevel, "PressureLevel"},
			}
			for _, ev := range statusEvents {
				event := models.Event{
					EventType: ev.typ,
					Value:     strconv.FormatFloat(ev.val, 'f', 2, 64),
					CreatedBy: "system",
				}
				s.broadcast(event)
			}

			// 4. 阈值触发诊断（只要有一项突破阈值就触发）
			triggerDiag := false
			if oldStatus.HullLevel >= hullMin && s.status.HullLevel < hullMin {
				triggerDiag = true
			}
			if oldStatus.FuelLevel >= fuelMin && s.status.FuelLevel < fuelMin {
				triggerDiag = true
			}
			if oldStatus.OxygenLevel >= oxygenMin && s.status.OxygenLevel < oxygenMin {
				triggerDiag = true
			}
			if oldStatus.TemperatureLevel <= tempMax && s.status.TemperatureLevel > tempMax {
				triggerDiag = true
			}
			if (oldStatus.PressureLevel >= pressureMin && s.status.PressureLevel < pressureMin) ||
				(oldStatus.PressureLevel <= pressureMax && s.status.PressureLevel > pressureMax) {
				triggerDiag = true
			}
			if triggerDiag {
				go s.doDiagnostic()
			}

			s.lock.Unlock()
		case <-s.done:
			s.logger.Info("adjust status stopped")
			return
		}
	}
}

func (s *SingleMissionService) telemetry() {
	s.logger.Info("telemetry started")

	ticker := time.NewTicker(500 * time.Microsecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.logger.Info("telemetry", zap.Any("status", s.status), zap.Any("settings", s.settings))
		case <-s.done:
			s.logger.Info("telemetry stopped")
			return
		}
	}
}

const accidentTimeWindow = 5 * time.Minute

func (s *SingleMissionService) accident() {
	ticker := time.NewTicker(accidentTimeWindow)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			successRate := s.settings.Stabilizer
			if !shouldAccident(accidentTimeWindow, successRate) {
				continue
			}
			s.logger.Info("accident occurred")
			a, err := s.db.GetRandomAccident()
			if err != nil {
				s.logger.Error("failed to get random accident", zap.Error(err))
				continue
			}
			for range a {
				// TODO: 向 accidentCh 发送事故事件
			}
		case <-s.done:
			s.logger.Info("accident check stopped")
			return
		}
	}
}

func (s *SingleMissionService) processAccident() {
	// TODO: 处理事故事件，和 processNormalEvent 类似
}

func shouldAccident(duration time.Duration, successRate float64) bool {
	if successRate < 0 || successRate > 1 {
		return false
	}
	failureRate := 1.0 - successRate
	effectiveFailureRate := 1.0 - math.Exp(-failureRate*float64(duration)/float64(accidentTimeWindow))
	return rand.Float64() < effectiveFailureRate
}

func (s *SingleMissionService) doDiagnostic() {
	// TODO: 实现诊断逻辑
}
