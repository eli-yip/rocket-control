package controller

import (
	"net/http"

	"github.com/eli-yip/rocket-control/db"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type (
	// TODO: 使用 https://github.com/rezakhademix/govalidator 校验数据
	AddMissionRequest struct {
		Name     string `json:"name"`
		Duration int    `json:"duration"`

		Desc        string  `json:"desc"`
		SuccessRate float64 `json:"success_rate"`
	}
)

type MissionHandler struct {
	db db.MissionIface
}

func NewMissionHandler(db db.MissionIface) *MissionHandler { return &MissionHandler{db: db} }

func (h *MissionHandler) AddMission(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	user := c.Get("username").(string)

	var req AddMissionRequest
	if err = c.Bind(&req); err != nil {
		logger.Error("failed to bind request", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("failed to bind request"))
	}

	mission, err := h.db.AddMission(req.Name, user, req.Duration)
	if err != nil {
		logger.Error("failed to add mission", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to add mission"))
	}

	if err = c.JSON(http.StatusOK, WrapRespWithData("success", mission)); err != nil {
		logger.Error("failed to send response", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to send response"))
	}
	return
}

func (h *MissionHandler) GetMission(c echo.Context) (err error)
func (h *MissionHandler) GetMissionList(c echo.Context) (err error)
func (h *MissionHandler) UpdateMissionStatus(c echo.Context) (err error)
