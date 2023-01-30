import {GoFunction} from "@aws-cdk/aws-lambda-go-alpha";
import {Duration, Tags} from "aws-cdk-lib";
import {FunctionsStackProps} from "./functions-stack";
import {Construct} from "constructs";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {CfnStateMachine} from "aws-cdk-lib/aws-stepfunctions";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class HandlerFunc extends Construct {
    private _handler: IFunction;

    constructor(scope: Construct, id: string, props: FunctionsStackProps, sm: CfnStateMachine) {
        super(scope, id);
        this.buildHandler(props, sm);
    }

    buildHandler = (props: FunctionsStackProps, sm: CfnStateMachine) => {
        this._handler = new GoFunction(this, `GetByIdFunction`, {
            entry: path.join(__dirname, `../src/event-handler`),
            functionName: `healthlake-cdc-handler`,
            timeout: Duration.seconds(30),
            environment: {
                "DD_FLUSH_TO_LOG": "true",
                "DD_TRACE_ENABLED": "true",
                "STATE_MACHINE_ARN": sm.attrArn,
            },
        });

        Tags.of(this._handler).add("version", props.version);
        this._handler.addToRolePolicy(
            new PolicyStatement({
                resources: [sm.attrArn],
                actions: [
                    'states:DescribeExecution',
                    'states:StartExecution',
                    'states:StartSyncExecution',
                    'states:StopExecution',
                ],
                effect: Effect.ALLOW,
            })
        );
    }

    get handler(): IFunction {
        return this._handler;
    }
}
