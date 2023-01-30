import * as cdk from 'aws-cdk-lib';
import {Construct} from "constructs";
import {Options, StageEnvironment} from "../types/options";
import { EventBridgeRuleStack } from './event-bridge-rule-stack';
import { FunctionsStack } from './functions-stack';
import {HydratorStateMachineStack} from "./state-machine-stack";
import {HandlerFunc} from "./handler-func";
import {ResourceDeduperStack} from "./resource-deduper-stack";
import {HealthlakeStack} from "./healthlake-stack";

export class AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const version = new Date().toISOString();
        const hlStack = new HealthlakeStack(this, 'HealthlakeStack')

        const func = new FunctionsStack(this, 'RuleHandler', {
            version: version
        }, hlStack.cfnFHIRDatastore);

        const dedupe = new ResourceDeduperStack(this, 'ResourceDeduper', {
            version: version
        })

        const sm = new HydratorStateMachineStack(this,
            `StateMachine`,
            {
                patientHydratorFunc: func.patientHydrator,
                patientPublisherFunc: func.patientPublisher,
                resourceDeduperFunc: dedupe.func,

            });


        const handlerFunc = new HandlerFunc(this, 'HandlerFunc', {
            version: version
        }, sm.stateMachine)

        new EventBridgeRuleStack(this, 'EventBridgeRule', {
            func: handlerFunc.handler
        })
    }
}
