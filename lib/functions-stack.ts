import {GoFunction} from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import {Duration, Fn, Tags} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from "path";
import {IFunction} from 'aws-cdk-lib/aws-lambda';
import {addHealthlakeToFunc} from "./function-utils";
import {CfnFHIRDatastore} from "aws-cdk-lib/aws-healthlake";

export interface FunctionsStackProps extends cdk.NestedStackProps {
    version: string
}


export class FunctionsStack extends cdk.NestedStack {
    private _allergyIntoleranceHydrator: IFunction;
    private _patientHydrator: IFunction;
    private _patientPublisher: IFunction;
    private readonly _storeId: string;

    constructor(scope: Construct, id: string, props: FunctionsStackProps, hl: CfnFHIRDatastore) {
        super(scope, id, props);
        this._storeId = Fn.importValue('main-HealthlakeInfra-primary-store-id')
        this.buildPatientHydrator(hl);
        this.buildPatientPublisher(hl);

        Tags.of(this._patientHydrator).add("version", props.version);
        Tags.of(this._patientPublisher).add("version", props.version);
    }

    buildPatientHydrator = (hl: CfnFHIRDatastore) => {
        this._patientHydrator = new GoFunction(this, `PatientHydratorFunction`, {
            entry: path.join(__dirname, `../src/patient-hydrator`),
            functionName: `healthlake-cdc-patient-hydrator`,
            timeout: Duration.seconds(30),
            environment: {
                "DD_FLUSH_TO_LOG": "true",
                "DD_TRACE_ENABLED": "true",
                "HL_STORE_ID": this._storeId
            },
        });

        addHealthlakeToFunc(this, 'PatientHydratorFunction', this._patientHydrator, hl);
    }

    buildPatientPublisher = (hl: CfnFHIRDatastore) => {
        this._patientPublisher = new GoFunction(this, `PatientPublisherFunction`, {
            entry: path.join(__dirname, `../src/patient-publisher`),
            functionName: `healthlake-cdc-patient-publisher`,
            timeout: Duration.seconds(30),
            environment: {
                "DD_FLUSH_TO_LOG": "true",
                "DD_TRACE_ENABLED": "true",
            },
        });
    }

    get patientHydrator(): IFunction {
        return this._patientHydrator;
    }

    get patientPublisher(): IFunction {
        return this._patientPublisher;
    }
}