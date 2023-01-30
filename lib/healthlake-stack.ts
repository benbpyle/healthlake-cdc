import * as cdk from 'aws-cdk-lib';
import * as hl from 'aws-cdk-lib/aws-healthlake';
import {Construct} from "constructs";
import {HealthlakeKey} from "./kms-stack";
import {CfnOutput} from "aws-cdk-lib";

export class HealthlakeStack extends cdk.Stack {
    private readonly _cfnFHIRDatastore: hl.CfnFHIRDatastore;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        const key = new HealthlakeKey(this, 'HealthlakeKey')

        this._cfnFHIRDatastore = new hl.CfnFHIRDatastore(this, 'HealthlakeDataStore', {
            datastoreTypeVersion: 'R4',
            datastoreName: `primary-store`,
            sseConfiguration: {
                kmsEncryptionConfig: {
                    cmkType: 'CUSTOMER_MANAGED_KMS_KEY',
                    kmsKeyId: key.key.keyId,
                },
            },
        });
    }

    get cfnFHIRDatastore(): hl.CfnFHIRDatastore {
        return this._cfnFHIRDatastore;
    }
}
