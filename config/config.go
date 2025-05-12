package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/pelletier/go-toml/v2"
)

var C Config

type Config struct {
	Settings struct {
		Debug bool `toml:"debug"`
	} `toml:"settings"`
	Database DatabaseConfig `toml:"database"`
}

type DatabaseConfig struct {
	Host     string `toml:"host"`
	Port     string `toml:"port"`
	User     string `toml:"user"`
	Password string `toml:"password"`
	Name     string `toml:"name"`
}

func InitForTestToml() (err error) {
	projectRoot, err := findProjectRoot()
	if err != nil {
		return fmt.Errorf("failed to find project root: %w", err)
	}

	configPath := filepath.Join(projectRoot, "config.toml")
	if err = InitFromToml(configPath); err != nil {
		return fmt.Errorf("failed to init config from file: %w", err)
	}

	return nil
}

func findProjectRoot() (path string, err error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get current working directory: %w", err)
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}

		if dir == "/" {
			return "", fmt.Errorf("failed to find project root")
		}

		dir = filepath.Dir(dir)
	}
}

func InitFromToml(path string) (err error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	if err = toml.Unmarshal(data, &C); err != nil {
		return fmt.Errorf("failed to unmarshal toml: %w", err)
	}

	return nil
}
