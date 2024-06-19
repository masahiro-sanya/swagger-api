import * as cdk from 'aws-cdk-lib';
import {
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as openapix from '@alma-cdk/openapix';
import * as path from 'path';

export class RestApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const project = this.node.tryGetContext('project');
        const phase = this.node.tryGetContext('attrphase');

        // Swagger UI Hosting
        /************************************* S3 Bucket *************************************/
        const swgHostingBucket = new s3.Bucket(
            this,
            `${project}-${phase}-swagger-hosting-bucket`,
            {
                bucketName: `${project}-${phase}-swagger-hosting-bucket`,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                encryption: s3.BucketEncryption.S3_MANAGED,
                versioned: true,
            }
        );

        // OAI作成
        const oai = new cloudfront.OriginAccessIdentity(
            this,
            `${project}-${phase}-swagger-oai`,
            { comment: `${project}-${phase}-swagger-oai` }
        );
        // バケットポリシー作成
        const swgBucketPolicy = new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:ListBucket'],
            effect: iam.Effect.ALLOW,
            principals: [
                new iam.CanonicalUserPrincipal(
                    oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
                ),
            ],
            resources: [
                `${swgHostingBucket.bucketArn}/*`,
                `${swgHostingBucket.bucketArn}`,
            ],
        });
        swgHostingBucket.addToResourcePolicy(swgBucketPolicy);

        // Coudfrontディストリビューション作成
        const distribution = new cloudfront.Distribution(
            this,
            `${project}-${phase}-swagger-hosting-distribution`,
            {
                comment: `${project}-${phase}-swagger-hosting-distribution`,
                priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
                defaultBehavior: {
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    viewerProtocolPolicy:
                        cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new origins.S3Origin(swgHostingBucket),
                },
            }
        );

        // Swagger UI 資材をデプロイ
        new s3deploy.BucketDeployment(
            this,
            `${project}-${phase}-swagger-deployment`,
            {
                sources: [
                    s3deploy.Source.asset('./openapi', {
                        exclude: ['.DS_Store'],
                    }),
                ],
                destinationBucket: swgHostingBucket,
                destinationKeyPrefix: 'swagger', // optional prefix in destination bucket
            }
        );

        /************************************* Lambda Function *************************************/
        const greetFn = new NodejsFunction(
            this,
            `${project}-${phase}-hello-function`,
            {
                functionName: `${project}-${phase}-hello-function`,
                entry: path.join(__dirname, '../lambda/hello-function.ts'),
                runtime: Runtime.NODEJS_18_X,
                handler: 'handler',
            }
        );

        /************************************* API Gateway *************************************/
        new openapix.Api(this, `${project}-${phase}-hello-api`, {
            source: path.join(__dirname, '../openapi/spec/openapi.yaml'),
            paths: {
                '/test': {
                    get: new openapix.LambdaIntegration(this, greetFn),
                },
            },
        });
    }
}
