package main

import (
	"net"
	"net/http"

	echopprof "github.com/eli-yip/echo-pprof"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"

	"github.com/eli-yip/rocket-control/controller"
	"github.com/eli-yip/rocket-control/db"
	"github.com/eli-yip/rocket-control/mission"
)

func setupEcho(db db.Iface, logger *zap.Logger) (e *echo.Echo) {
	e = echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.IPExtractor = echo.ExtractIPFromXFFHeader(
		echo.TrustIPRange(func(ip string) *net.IPNet {
			_, ipNet, _ := net.ParseCIDR(ip)
			return ipNet
		}("172.0.0.0/8")), // trust docker network
	)
	e.Use(
		middleware.RequestID(), // add request id
		middleware.Recover(),   // recover from panic
		middleware.CORSWithConfig(middleware.CORSConfig{
			AllowOrigins: []string{
				"http://localhost:8080",
				"http://localhost:5173",
			},
			AllowHeaders: []string{
				"content-type",
				"origin",
				"Sec-GPC",
				"Sec-Fetch-Site",
				"Sec-Fetch-Mode",
				"Sec-Fetch-Dest",
			},
			AllowMethods: []string{
				http.MethodGet,
				http.MethodHead,
				http.MethodPut,
				http.MethodPatch,
				http.MethodPost,
				http.MethodDelete,
				http.MethodOptions,
			},
			AllowCredentials: true,
			MaxAge:           60 * 60 * 24,
		}),
		LogRequest(logger),   // log request
		InjectLogger(logger), // inject logger to context
	)

	apiGroup := e.Group("/api/v1")

	healthEndpoint := apiGroup.GET("/health", func(c echo.Context) error { return c.JSON(http.StatusOK, map[string]string{"status": "ok"}) })
	healthEndpoint.Name = "Health check route"

	missionHandler := controller.NewMissionHandler(db)
	missionAPI := apiGroup.Group("/mission")
	missionAPI.Use(InjectUser())
	missionAPI.GET("/:id", missionHandler.GetMission)
	missionAPI.GET("", missionHandler.GetMissionList)
	missionAPI.POST("", missionHandler.AddMission)
	missionAPI.PATCH("/:id", missionHandler.UpdateMissionStatus)

	diagnosticHandler := controller.NewDiagnosticHandler(db)
	diagnosticAPI := apiGroup.Group("/diagnostic")
	diagnosticAPI.Use(InjectUser())
	diagnosticAPI.GET("/:id", diagnosticHandler.GetDiagnostic)
	diagnosticAPI.GET("", diagnosticHandler.GetDiagnosticList)
	diagnosticAPI.POST("", diagnosticHandler.CreateDiagnostic)

	mission.InitMissionService(db)
	rocketHandler := controller.NewRocketController(mission.MissionServiceInstance)
	rocketAPI := apiGroup.Group("/rocket")
	rocketAPI.Use(InjectUser())
	rocketAPI.GET("", rocketHandler.JoinMission)

	// iterate all routes and log them
	for _, r := range e.Routes() {
		logger.Info("route", zap.String("name", r.Name), zap.String("path", r.Path))
	}

	echopprof.Wrap(e)

	return e
}
