package main

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	log "github.com/sirupsen/logrus"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	"event-handler/lib"
)

type DedupeRepository interface {
	WriteDedupeWithContext(context.Context, string, time.Time, *lib.PublishedPatientEvent) error
}

type DynamoDedupeRepository struct {
	db    *dynamodb.DynamoDB
	table string
}

func NewDynamoDedupeRepository(db *dynamodb.DynamoDB, tableName string) *DynamoDedupeRepository {
	return &DynamoDedupeRepository{
		db:    db,
		table: tableName,
	}
}

func (d *DynamoDedupeRepository) WriteDedupeWithContext(ctx context.Context, key string, eventTime time.Time, state *lib.PublishedPatientEvent) error {
	span, _ := tracer.SpanFromContext(ctx)
	stringTime := eventTime.Format(time.RFC3339)
	marshalledEvent, err := dynamodbattribute.MarshalMap(&DedupeRecord{
		PK:       key,
		SK:       stringTime,
		Resource: *state,
	})
	input := &dynamodb.PutItemInput{
		Item:                marshalledEvent,
		ConditionExpression: aws.String("attribute_not_exists(SK)"),
		TableName:           aws.String(d.table),
	}

	log.WithFields(log.Fields{
		"input":         input,
		"span_id":       span.Context().SpanID(),
		"trace_id":      span.Context().TraceID(),
		"correlationId": ctx.Value("correlationId"),
	}).Debug("Pre save")
	_, err = d.db.PutItemWithContext(ctx, input)

	if err != nil {
		if erro, ok := err.(awserr.Error); ok {
			// the write failed so we know it's a dupe
			if erro.Code() == dynamodb.ErrCodeConditionalCheckFailedException {
				state.MetaDetails.IsDupe = true
				return nil
			}
		}

		// the error is something else so better retry this thing
		return err
	}

	// all good and it's written now
	return nil

}

type DedupeRecord struct {
	PK       string                    `dynamodbav:"PK"`
	SK       string                    `dynamodbav:"SK"`
	Resource lib.PublishedPatientEvent `dynamodbav:"Resource"`
}
