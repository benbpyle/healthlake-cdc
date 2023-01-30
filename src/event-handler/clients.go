package main

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sfn"
	"github.com/aws/aws-sdk-go/service/sfn/sfniface"
	awstrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/aws/aws-sdk-go/aws"
)

func NewStepFunctionClient() sfniface.SFNAPI {
	c := &aws.Config{
		Region: aws.String("us-west-2")}

	sess := session.Must(session.NewSession(c))
	sess = awstrace.WrapSession(sess,
		awstrace.WithAnalytics(true),
		awstrace.WithAnalyticsRate(1.0))
	svc := sfn.New(sess)
	return sfniface.SFNAPI(svc)
}
