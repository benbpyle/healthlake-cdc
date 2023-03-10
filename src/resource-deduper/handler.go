package main

import (
	"context"
	"os"

	ddlambda "github.com/DataDog/datadog-lambda-go"
	"github.com/aws/aws-lambda-go/lambda"
	log "github.com/sirupsen/logrus"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	"event-handler/lib"
)

var dbRepos DedupeRepository

func init() {
	log.SetFormatter(&log.JSONFormatter{
		PrettyPrint: false,
	})

	dbRepos = NewDynamoDedupeRepository(
		lib.NewDynamoDBClient(),
		os.Getenv("TABLE_NAME"))
	lib.SetLevel(os.Getenv("LOG_LEVEL"))
}

func main() {
	lambda.Start(ddlambda.WrapFunction(handler, lib.DataDogConfig()))
}

func handler(ctx context.Context, event lib.PublishedPatientEvent) (*lib.PublishedPatientEvent, error) {
	span, _ := tracer.SpanFromContext(ctx)
	newCtx := context.WithValue(ctx, "correlationId", event.MetaDetails.CorrelationId)

	log.WithFields(
		log.Fields{
			"event":         event,
			"span_id":       span.Context().SpanID(),
			"trace_id":      span.Context().TraceID(),
			"correlationId": newCtx.Value("correlationId"),
		}).Info("Logging out the event")

	err := dbRepos.WriteDedupeWithContext(newCtx, event.MetaDetails.IdempotencyKey, event.MetaDetails.SourceTime, &event)

	if err != nil {
		return nil, err
	}

	return &event, nil
}
