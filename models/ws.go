package models

import (
	"time"

	"github.com/eli-yip/rocket-control/db"
)

type WsMessage struct {
	Action    Action         `json:"action"`
	Status    db.EventStatus `json:"status"`
	CreatedBy string         `json:"created_by"`
	Time      time.Time      `json:"time"`
	Msg       string         `json:"msg"`
}
