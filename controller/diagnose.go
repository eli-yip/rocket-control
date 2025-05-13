package controller

import (
	"github.com/eli-yip/rocket-control/db"
	"github.com/labstack/echo/v4"
)

type DiagnosticHandler struct{ db db.DiagnosticIface }

func NewDiagnosticHandler(db db.DiagnosticIface) *DiagnosticHandler {
	return &DiagnosticHandler{db: db}
}

func (h *DiagnosticHandler) CreateDiagnostic(c echo.Context) (err error) {
	return nil
}

func (h *DiagnosticHandler) GetDiagnostic(c echo.Context) (err error) {
	return nil
}

func (h *DiagnosticHandler) GetDiagnosticList(c echo.Context) (err error) {
	return nil
}

func (h *DiagnosticHandler) UpdateDiagnosticStatus(c echo.Context) (err error) {
	return nil
}
