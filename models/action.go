package models

import (
	"github.com/eli-yip/rocket-control/db"
)

type Action struct {
	Type  db.EventType `json:"type"`
	Value string       `json:"value"`
}

func (a *Action) ToEvent(user string) Event {
	return Event{
		EventType: a.Type,
		Status:    db.EventStatusPending,
		Value:     a.Value,
		CreatedBy: user,
	}
}
