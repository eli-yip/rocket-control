package mission

import "sync"

type MissionService struct{ m sync.Map }

func NewMissionService() *MissionService

func (ms *MissionService) AddMission(id uint) (err error)

func (ms *MissionService) JoinMission(id uint, user string) (<-chan Event, error)
func (ms *MissionService) LeaveMission(id uint, user string) (err error)
func (ms *MissionService) GetCommChannel(id uint, user string) (<-chan Event, error)
func (ms *MissionService) AddEvent(id uint, event Event)
