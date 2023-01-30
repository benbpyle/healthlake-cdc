import * as cdk from 'aws-cdk-lib';
import {CfnOutput} from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import {Construct} from "constructs";

export class HealthlakeKey extends cdk.NestedStack {
    private readonly _key: kms.Key;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this._key = new kms.Key(this, `Key`);
        this._key.addAlias(`alias/healthlake-key`);

        new CfnOutput(this, 'HealthlakeKmsArn', {
            value: this._key.keyArn,
            description: `ARN of the primary-store kms key`,
            exportName: `primary-store-kms-arn`,
        });

        new CfnOutput(this, 'HealthlakeKmsId', {
            value: this._key.keyId,
            description: `ID of the primary-store kms key`,
            exportName: `primary-store-kms-id`,
        });
    }

    get key(): kms.Key {
        return this._key;
    }
}