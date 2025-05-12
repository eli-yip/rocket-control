package controller

import (
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

func ExtractLogger(c echo.Context) *zap.Logger {
	return c.Get("logger").(*zap.Logger)
}

// ApiResp represents the structure of the API response.
type ApiResp[T any] struct {
	Message string `json:"message,omitempty"`
	Data    T      `json:"data,omitempty"`
}

type EmptyData struct{}

func WrapRespWithData[T any](message string, data T) *ApiResp[T] {
	return &ApiResp[T]{
		Message: message,
		Data:    data,
	}
}

func WrapResp(message string) *ApiResp[EmptyData] { return &ApiResp[EmptyData]{Message: message} }
