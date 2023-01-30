package main

import (
	"time"

	"event-handler/lib"
)

type CloudtrailEvent struct {
	Account    string          `json:"account"`
	Detail     lib.EventDetail `json:"detail"`
	DetailType string          `json:"detail-type"`
	Id         string          `json:"id"`
	Source     string          `json:"source"`
	Time       time.Time       `json:"time"`
}
