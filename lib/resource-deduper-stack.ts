import {Duration, NestedStack, RemovalPolicy, Tags} from "aws-cdk-lib";
import {Construct} from "constructs";
import {FunctionsStackProps} from "./functions-stack";
import {Key} from "aws-cdk-lib/aws-kms";
import {AttributeType, BillingMode, Table, TableEncryption} from "aws-cdk-lib/aws-dynamodb";
import {GoFunction} from "@aws-cdk/aws-lambda-go-alpha";
import {getLogLevel} from "./pipeline-utils";
import * as path from "path";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export class ResourceDeduperStack extends NestedStack {
    private readonly _func: IFunction;

    constructor(scope: Construct, id: string, props: FunctionsStackProps) {
        super(scope, id, props);

        const key = new Key(this, `${props?.options.stackNamePrefix}-${props?.options.stackName}-Key`,
            {
                removalPolicy: RemovalPolicy.DESTROY
            });
        key.addAlias(`alias/${props.options.reposName}`);

        const tableName = `${props?.options.stackNamePrefix}-MdaResourceDeduper`;

        const table = new Table(this, id, {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: {name: 'PK', type: AttributeType.STRING},
            sortKey: {name: 'SK', type: AttributeType.STRING},
            pointInTimeRecovery: true,
            tableName: tableName,
            encryption: TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: key
        });

        this._func = new GoFunction(this, `ResourceDedupeFunc`, {
            entry: path.join(__dirname, `../src/resource-deduper`),
            functionName: `${props?.options.stackNamePrefix}-healthlake-cdc-resource-deduper`,
            timeout: Duration.seconds(30),
            environment: {
                "DD_FLUSH_TO_LOG": "true",
                "DD_TRACE_ENABLED": "true",
                "LOG_LEVEL": getLogLevel(props.stage),
                "TABLE_NAME": tableName
            },
        });

        Tags.of(this._func).add("version", props.version);
        table.grantReadWriteData(this._func);
        key.grantEncryptDecrypt(this._func);
    }

    get func(): IFunction {
        return this._func;
    }
}
