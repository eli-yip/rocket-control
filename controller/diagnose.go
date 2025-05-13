package controller

import (
	"net/http"
	"strconv"

	"github.com/eli-yip/rocket-control/db"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type DiagnosticHandler struct{ db db.DiagnosticIface }

func NewDiagnosticHandler(db db.DiagnosticIface) *DiagnosticHandler {
	return &DiagnosticHandler{db: db}
}

func (h *DiagnosticHandler) CreateDiagnostic(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	user := c.Get("username").(string)

	type reqBody struct {
		MissionID uint   `json:"mission_id"`
		Desc      string `json:"desc"`
		Result    any    `json:"result"`
	}
	var req reqBody
	if err = c.Bind(&req); err != nil {
		logger.Error("failed to bind request", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("failed to bind request"))
	}
	diag, err := h.db.CreateDiagnostic(req.MissionID, user, req.Desc, req.Result)
	if err != nil {
		logger.Error("failed to create diagnostic", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to create diagnostic"))
	}
	return c.JSON(http.StatusOK, WrapRespWithData("success", diag))
}

func (h *DiagnosticHandler) GetDiagnostic(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		logger.Error("invalid diagnostic id", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("invalid diagnostic id"))
	}
	diag, err := h.db.GetDiagnostic(uint(id))
	if err != nil {
		logger.Error("failed to get diagnostic", zap.Error(err))
		return c.JSON(http.StatusNotFound, WrapResp("diagnostic not found"))
	}
	return c.JSON(http.StatusOK, WrapRespWithData("success", diag))
}

func (h *DiagnosticHandler) GetDiagnosticList(c echo.Context) (err error) {
	logger := ExtractLogger(c)
	missionIDStr := c.QueryParam("mission_id")
	if missionIDStr == "" {
		return c.JSON(http.StatusBadRequest, WrapResp("mission_id is required"))
	}
	missionID, err := strconv.ParseUint(missionIDStr, 10, 64)
	if err != nil {
		logger.Error("invalid mission_id", zap.Error(err))
		return c.JSON(http.StatusBadRequest, WrapResp("invalid mission_id"))
	}
	list, err := h.db.GetDiagnosticList(uint(missionID))
	if err != nil {
		logger.Error("failed to get diagnostic list", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, WrapResp("failed to get diagnostic list"))
	}
	return c.JSON(http.StatusOK, WrapRespWithData("success", list))
}
