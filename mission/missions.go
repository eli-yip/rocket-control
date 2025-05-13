package mission

import (
	"errors"
	"sync"

	"github.com/eli-yip/rocket-control/db"
	"github.com/eli-yip/rocket-control/models"
)

type MissionService struct {
	db db.Iface
	m  sync.Map
}

func NewMissionService(db db.Iface) *MissionService {
	return &MissionService{db: db}
}

var (
	ErrMissionAlreadyExists = errors.New("mission already exists")
	ErrMissionNotFound      = errors.New("mission not found")
)

func (ms *MissionService) AddMission(id uint) (err error) {
	if _, ok := ms.m.Load(id); ok {
		return ErrMissionAlreadyExists
	}

	sms, err := NewSingleMissionService(ms.db, id)
	if err != nil {
		return err
	}
	ms.m.Store(id, sms)
	return nil
}

func (ms *MissionService) JoinMission(id uint, user string) (<-chan models.WsMessage, error) {
	v, ok := ms.m.Load(id)
	if !ok {
		return nil, ErrMissionNotFound
	}
	sms := v.(*SingleMissionService)
	return sms.JoinMission(user)
}

func (ms *MissionService) LeaveMission(id uint, user string) (err error) {
	v, ok := ms.m.Load(id)
	if !ok {
		return ErrMissionNotFound
	}
	sms := v.(*SingleMissionService)
	return sms.LeaveMission(user)
}

func (ms *MissionService) GetCommChannel(id uint, user string) (<-chan models.WsMessage, error) {
	v, ok := ms.m.Load(id)
	if !ok {
		return nil, ErrMissionNotFound
	}
	sms := v.(*SingleMissionService)
	return sms.GetCommChannel(user)
}

func (ms *MissionService) AddEvent(id uint, event models.Event) {
	v, ok := ms.m.Load(id)
	if !ok {
		return
	}
	sms := v.(*SingleMissionService)
	sms.AddEvent(event)
}
