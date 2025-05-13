package controller

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/eli-yip/rocket-control/db"
	"github.com/eli-yip/rocket-control/mission"
	"github.com/labstack/echo/v4"
	"github.com/rezakhademix/govalidator/v2"
	"go.uber.org/zap"
)

type RocketController struct {
	missionService *mission.MissionService
}

func NewRocketController(missionService *mission.MissionService) *RocketController {
	return &RocketController{missionService: missionService}
}

type Action struct {
	Type  db.EventType `json:"type"`
	Value string       `json:"value"`
}

type WsMessage struct{}

func (h *RocketController) JoinMission(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	user := c.Get("username").(string)
	token := c.QueryParam("token")
	missionIDStr := c.QueryParam("mission_id")
	v := govalidator.New()
	v.RequiredString(missionIDStr, "mission_id", "mission_id is required")
	v.RequiredString(token, "token", "token is required")
	if v.IsFailed() {
		for k, v := range v.Errors() {
			logger.Error("validation failed", zap.String("field", k), zap.String("error", v))
		}
		return c.JSON(http.StatusBadRequest, WrapRespWithData("validation failed", v.Errors()))
	}
	missionIDUint64, err := strconv.ParseUint(missionIDStr, 10, 64)
	if err != nil {
		logger.Error("failed to parse mission_id", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("failed to parse mission_id"))
	}
	missionID := uint(missionIDUint64)
	messageCh, err := h.missionService.JoinMission(missionID, user)
	if err != nil {
		logger.Error("failed to join mission", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to join mission"))
	}
	defer h.missionService.LeaveMission(missionID, user)

	opts := &websocket.AcceptOptions{OriginPatterns: []string{"*"}}
	ws, err := websocket.Accept(c.Response(), c.Request(), opts)
	if err != nil {
		logger.Error("failed to accept websocket connection", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to accept websocket connection"))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	defer ws.Close(websocket.StatusNormalClosure, "")

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
				var action Action
				if err := wsjson.Read(ctx, ws, &action); err != nil {
					// TODO: handle error
				}
				event := actionToEvent(action)
				go h.missionService.AddEvent(missionID, event)
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return nil
		case e := <-messageCh:
			message := eventToMessage(e)
			writeCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
			err = wsjson.Write(writeCtx, ws, message)
			cancel()
			if err != nil {
				logger.Error("failed to write message to websocket", zap.Error(err))
				return nil
			}
		}
	}
}

func actionToEvent(action Action) mission.Event

func eventToMessage(event mission.Event) WsMessage
