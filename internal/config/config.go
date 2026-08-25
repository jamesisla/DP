package config

import (
	"os"
	"strconv"
)

type Config struct {
	AppName                  string
	Port                     string
	DatabasePath             string
	SecretKey                string
	AccessTokenExpireMinutes int
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "backend/sql_app.db"
	}

	secretKey := os.Getenv("SECRET_KEY")
	if secretKey == "" {
		secretKey = "change-me-in-production"
	}

	expireMin := 480
	if envExp := os.Getenv("ACCESS_TOKEN_EXPIRE_MINUTES"); envExp != "" {
		if val, err := strconv.Atoi(envExp); err == nil {
			expireMin = val
		}
	}

	return &Config{
		AppName:                  "SIGE-DP & Ciberseguridad ANCI",
		Port:                     port,
		DatabasePath:             dbPath,
		SecretKey:                secretKey,
		AccessTokenExpireMinutes: expireMin,
	}
}
