package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"time"

	"github.com/eli-yip/rocket-control/config"
	"github.com/eli-yip/rocket-control/db"
	"github.com/eli-yip/rocket-control/log"
	"github.com/eli-yip/rocket-control/migrate"
	"github.com/eli-yip/rocket-control/version"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var configPath string

func parseFlags() {
	flag.StringVar(&configPath, "config", "", "path to the config file")
	flag.Parse()
}

func main() {
	var err error

	parseFlags()
	if strings.HasSuffix(configPath, ".toml") {
		if err = config.InitFromToml(configPath); err != nil {
			panic("failed to init config from file: " + err.Error())
		}
	} else {
		panic("invalid config file extension: " + configPath + ", only `.toml` is supported")
	}

	logger := log.NewZapLogger()
	logger.Info("Init config from toml successfully", zap.Any("config", config.C))

	// Add global recover
	func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Fatal("Panic", zap.Any("panic", r))
			}
		}()
	}()

	db, err := initService(logger)
	fmt.Println("db", db)
	if err != nil {
		logger.Fatal("Failed to init service", zap.Error(err))
	}
	logger.Info("Init services successfully")

	// TODO: use real db interface impl
	e := setupEcho(nil, logger)
	logger.Info("Init echo server successfully")

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	// Start echo server
	go func() {
		logger.Info("Start server now!", zap.String("address", ":8080"), zap.String("version", version.Version))
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Shutdown server", zap.Error(err))
		}
	}()

	<-ctx.Done()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err = e.Shutdown(ctx); err != nil {
		logger.Fatal("Failed to shutdown server", zap.Error(err))
	}

	logger.Info("Shutdown server successfully")
}

func initService(logger *zap.Logger) (dbService *gorm.DB, err error) {
	if dbService, err = db.NewPostgresDB(config.C.Database); err != nil {
		logger.Error("Failed to init postgres database service", zap.Error(err))
		return nil, fmt.Errorf("failed to init db: %w", err)
	}
	logger.Info("db initialized")

	if err = migrate.MigrateDB(dbService); err != nil {
		logger.Error("Failed to migrate database", zap.Error(err))
		return nil, fmt.Errorf("failed to migrate db: %w", err)
	}

	return dbService, nil
}
