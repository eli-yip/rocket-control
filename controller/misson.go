package controller

import (
	"net/http"
	"strconv"

	"github.com/eli-yip/rocket-control/db"
	"github.com/labstack/echo/v4"
	"github.com/rezakhademix/govalidator/v2"
	"go.uber.org/zap"
)

type (
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

	v := govalidator.New()
	v.RequiredString(req.Name, "name", "name is required")
	v.RequiredInt(req.Duration, "duration", "duration is required")
	if v.IsFailed() {
		for k, v := range v.Errors() {
			logger.Error("validation failed", zap.String("field", k), zap.String("error", v))
		}
		return c.JSON(http.StatusBadRequest, WrapRespWithData("validation failed", v.Errors()))
	}

	// 支持可选参数
	opts := []db.MissionOptFunc{}
	if req.Desc != "" {
		opts = append(opts, db.WithMissionDesc(req.Desc))
	}
	if req.SuccessRate > 0 {
		opts = append(opts, db.WithMissionSuccessRate(req.SuccessRate))
	}

	mission, err := h.db.AddMission(req.Name, user, req.Duration, opts...)
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

func (h *MissionHandler) GetMission(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		logger.Error("invalid mission id", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("invalid mission id"))
	}
	mission, err := h.db.GetMission(uint(id))
	if err != nil {
		logger.Error("failed to get mission", zap.Error(err))
		return c.JSON(http.StatusNotFound, WrapResp("mission not found"))
	}
	return c.JSON(http.StatusOK, WrapRespWithData("success", mission))
}

func (h *MissionHandler) GetMissionList(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	list, err := h.db.GetMissionList()
	if err != nil {
		logger.Error("failed to get mission list", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to get mission list"))
	}
	return c.JSON(http.StatusOK, WrapRespWithData("success", list))
}

func (h *MissionHandler) UpdateMissionStatus(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		logger.Error("invalid mission id", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("invalid mission id"))
	}
	type reqBody struct {
		Status int `json:"status"`
	}
	var req reqBody
	if err = c.Bind(&req); err != nil {
		logger.Error("failed to bind request", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("failed to bind request"))
	}
	if err := h.db.UpdateMissionStatus(uint(id), db.MissionStatus(req.Status)); err != nil {
		logger.Error("failed to update mission status", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to update mission status"))
	}
	return c.JSON(http.StatusOK, WrapResp("success"))
}
