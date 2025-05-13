package models

import (
	"fmt"

	"github.com/eli-yip/rocket-control/db"
)

type Event struct {
	ID        uint
	EventType db.EventType
	Status    db.EventStatus
	Value     string
	CreatedBy string
}

func (e *Event) ToWsMessage(msg string) WsMessage {
	return WsMessage{
		Action: Action{
			Type:  e.EventType,
			Value: e.Value,
		},
		Status: e.Status,
		Msg:    fmt.Sprintf("event %d processed", e.ID),
	}
}
