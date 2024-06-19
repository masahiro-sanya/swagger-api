#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RestApiStack } from '../stacks/sampleProject_restApi';

const app = new cdk.App();

const phase = app.node.tryGetContext('attrphase');
const phaselist = app.node.tryGetContext('phaselist');
const target = app.node.tryGetContext('target');
const targetlist = app.node.tryGetContext('targetlist');

const env_jp = { account: cdk.Aws.ACCOUNT_ID, region: 'ap-northeast-1' };

// デプロイ時に phase がない場合エラー
if (!phase) {
    console.log(
        `augument error: please specify [-c attrphase=phaselist] at runtime. in phaselist= [${phaselist}]`
    );
    process.exit(1);
}

// デプロイ時に不正な phase を指定した場合エラー
if (phaselist.indexOf(phase) === -1) {
    console.log(`validation error: specify [attrphase] from [${phaselist}]`);
    process.exit(1);
}

// デプロイ時に target がない場合エラー
if (!target) {
    console.log(
        `augument error: please specify [-c target=targetlist] at runtime. in targetlist= [${targetlist}]`
    );
    process.exit(1);
}

// デプロイ時に不正な target を指定した場合エラー
if (targetlist.indexOf(target) === -1) {
    console.log(`validation error: specify [target] from [${targetlist}]`);
    process.exit(1);
}

if (target == 'app') {
    new RestApiStack(app, 'RestApiStack', {
        env: env_jp,
    });
}
