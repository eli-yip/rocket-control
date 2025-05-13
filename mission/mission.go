package mission

import (
	"fmt"
	"math"
	"math/rand/v2"
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
	// TODO: 处理事件
	logger := s.logger.With(zap.Uint("e_id", event.ID))
	logger.Info("processing event", zap.String("event_type", string(event.EventType)), zap.String("value", event.Value))
}

func (s *SingleMissionService) adjustSettings()

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

	ticker := time.NewTicker(500 * time.Microsecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// TODO: 处理状态调整
			s.lock.Lock()
			s.status.HullLevel -= 0.1
			s.status.FuelLevel -= 0.1
			s.status.OxygenLevel -= 0.1
			s.status.TemperatureLevel += 0.1
			s.status.PressureLevel += 0.1
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

func (s *SingleMissionService) doDiagnostic()
