import {Construct} from 'constructs';
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import {CfnFHIRDatastore} from "aws-cdk-lib/aws-healthlake";


export interface EventBridgeRuleStackProps extends cdk.NestedStackProps {
    func: IFunction
}

export class EventBridgeRuleStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: EventBridgeRuleStackProps, hl: CfnFHIRDatastore) {
        super(scope, id, props);
        const rule = new events.Rule(this, 'rule', {
            eventPattern: {
                source: ["aws.healthlake"],
                detailType: [
                    "AWS API Call via CloudTrail"
                ],
                detail: {
                    eventSource: [
                        "healthlake.amazonaws.com"
                    ],
                    eventName: [
                        "CreateResource",
                        "UpdateResource"
                    ],
                    requestParameters: {
                        datastoreId: [hl.attrDatastoreId]
                    },
                    responseElements: {
                        statusCode: [200, 201]
                    }
                }
            },
            ruleName: "capture-healthlake-events",
        });

        const queue = new sqs.Queue(this, 'Queue', {
            queueName: `rule-event-dlq`
        });

        rule.addTarget(new LambdaFunction(props.func, {
            deadLetterQueue: queue, // Optional: add a dead letter queue
            maxEventAge: cdk.Duration.hours(2), // Optional: set the maxEventAge retry policy
            retryAttempts: 2, // Optional: set the max number of retry attempts
        }));
    }

}
