package main

import (
	"context"
	"encoding/json"
	"os"

	ddlambda "github.com/DataDog/datadog-lambda-go"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/sfn"
	"github.com/aws/aws-sdk-go/service/sfn/sfniface"
	"github.com/segmentio/ksuid"
	log "github.com/sirupsen/logrus"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	"event-handler/lib"
)

var (
	stateMachineArn string
	client          sfniface.SFNAPI
)

func init() {
	stateMachineArn = os.Getenv("STATE_MACHINE_ARN")
	client = NewStepFunctionClient()

	log.SetLevel(log.DebugLevel)
	log.SetFormatter(&log.JSONFormatter{
		PrettyPrint: false,
	})
}

func main() {
	lambda.Start(ddlambda.WrapFunction(handler, lib.DataDogConfig()))
}

func handler(ctx context.Context, event CloudtrailEvent) error {
	span, _ := tracer.SpanFromContext(ctx)
	name := ksuid.New().String()
	newCtx := context.WithValue(ctx, "correlationId", name)

	log.WithFields(
		log.Fields{
			"event":         event,
			"span_id":       span.Context().SpanID(),
			"trace_id":      span.Context().TraceID(),
			"correlationId": newCtx.Value("correlationId"),
		}).Info("Logging out the event")

	body, _ := json.Marshal(lib.NewIncomingEvent(
		"1.0",
		"HealthLakeCDC",
		"CloudTrail",
		name,
		event.Detail))
	strBody := string(body)
	input := sfn.StartExecutionInput{
		Input:           &strBody,
		Name:            &name,
		StateMachineArn: &stateMachineArn,
	}

	execution, err := client.StartExecutionWithContext(newCtx, &input)

	log.WithFields(log.Fields{
		"error":         err,
		"result":        execution,
		"span_id":       span.Context().SpanID(),
		"trace_id":      span.Context().TraceID(),
		"correlationId": newCtx.Value("correlationId"),
	}).Debugf("StartSyncExecution result")

	return err
}
