package main

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/eli-yip/rocket-control/config"
	"github.com/eli-yip/rocket-control/controller"
)

// LogRequest is a middleware function that logs incoming requests and outgoing responses.
// The logger is used to log the request details such as request ID, method, path, IP address,
// and the response details such as latency and status code.
func LogRequest(logger *zap.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			startTime := time.Now()
			req := c.Request()
			method := req.Method
			path := req.URL.Path
			ip := c.Request().Header.Get(`Cf-Connecting-Ip`)
			if ip == "" {
				ip = c.RealIP()
			}
			requestID := c.Response().Header().Get(echo.HeaderXRequestID)
			message := "Received request"
			logger.Info(message,
				zap.String("request_id", requestID),
				zap.String("method", method),
				zap.String("path", path),
				zap.String("ip", ip),
			)

			if err := next(c); err != nil {
				c.Error(err)
			}

			endTime := time.Now()
			latency := endTime.Sub(startTime)
			statusCode := c.Response().Status
			size := c.Response().Size
			var level zapcore.Level
			if statusCode >= http.StatusInternalServerError {
				level = zapcore.ErrorLevel
			} else if statusCode >= http.StatusBadRequest {
				level = zapcore.WarnLevel
			} else {
				level = zapcore.InfoLevel
			}
			message = "Sent response"
			logger.Check(level, message).Write(
				zap.String("request_id", requestID),
				zap.Duration("latency", latency),
				zap.Int("status_code", statusCode),
				zap.Int64("size", size),
			)

			return nil
		}
	}
}

// InjectLogger is a middleware function that injects a logger into the echo context.
// The middleware function adds a request ID to the logger and sets it in the echo context.
func InjectLogger(logger *zap.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			reqeustID := c.Response().Header().Get(echo.HeaderXRequestID)
			logger := logger.With(zap.String("request_id", reqeustID))
			c.Set("logger", logger)
			return next(c)
		}
	}
}

func InjectUser() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			logger := controller.ExtractLogger(c)

			username := c.Request().Header.Get("Remote-User")
			nickname := c.Request().Header.Get("Remote-Name")

			if config.C.Settings.Debug {
				username, nickname = "jason", "Jason"
			}
			if username == "" || nickname == "" {
				logger.Error("missing username or nickname")
				return c.JSON(http.StatusBadRequest, controller.WrapResp("missing username or nickname"))
			}
			logger.Info("user info", zap.String("username", username), zap.String("nickname", nickname))
			c.Set("username", username)
			c.Set("nickname", nickname)
			return next(c)
		}
	}
}
