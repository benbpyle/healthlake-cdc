package lib

import (
	"fmt"
	"time"

	"github.com/bix-digital/golang-fhir-models/fhir-models/fhir"
)

type CurantisEvent struct {
	Version       string `json:"version"`
	Source        string `json:"source"`
	EventType     string `json:"eventType"`
	CorrelationId string `json:"correlationId"`
}

type CurantisIncomingEvent struct {
	CurantisEvent
	Details EventDetail `json:"details"`
}

type CurantisPublishedPatientEvent struct {
	MetaDetails MetaDetails  `json:"meta"`
	Details     fhir.Patient `json:"data"`
}

type EventDetail struct {
	EventID           string            `json:"eventID"`
	EventName         string            `json:"eventName"`
	EventSource       string            `json:"eventSource"`
	EventTime         time.Time         `json:"eventTime"`
	EventType         string            `json:"eventType"`
	EventVersion      string            `json:"eventVersion"`
	RequestID         string            `json:"requestID"`
	RequestParameters RequestParameters `json:"requestParameters"`
	ResponseElements  ResponseElements  `json:"responseElements"`
}

type ResponseElements struct {
	StatusCode int `json:"statusCode"`
}

type RequestParameters struct {
	DatastoreId  string `json:"datastoreId"`
	ResourceType string `json:"resourceType"`
}

type PatientList struct {
	Patients []PatientPublisherState `json:"patients"`
}

type PatientPublisherState struct {
	Patient     fhir.Patient `json:"patient"`
	MetaDetails MetaDetails  `json:"meta"`
}

type MetaDetails struct {
	CorrelationId  string    `json:"correlationId"`
	IdempotencyKey string    `json:"idempotencyKey"`
	SourceTime     time.Time `json:"sourceTime"`
	IsDupe         bool      `json:"isDupe"`
}

func NewCurantisIncomingEvent(version string, eventType string, source string, correlationId string, details EventDetail) *CurantisIncomingEvent {
	return &CurantisIncomingEvent{
		CurantisEvent: CurantisEvent{
			Version:       version,
			Source:        source,
			EventType:     eventType,
			CorrelationId: correlationId,
		},
		Details: details,
	}
}

func NewCurantisPublishedPatientEvent(meta MetaDetails, details fhir.Patient) *CurantisPublishedPatientEvent {
	return &CurantisPublishedPatientEvent{
		MetaDetails: meta,
		Details:     details,
	}
}

func BuildIdempotencyKey(resourceType string, resourceId string, eventTime time.Time) string {
	// ResourceType:ID:DD:MM:YYYY
	return fmt.Sprintf("%s:%s:%02d:%02d:%04d",
		resourceType,
		resourceId,
		eventTime.Month(),
		eventTime.Day(),
		eventTime.Year())
}
