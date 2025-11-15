#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockAccessStack } from '../lib/bedrock-stack';

const app = new cdk.App();

new BedrockAccessStack(app, 'MiniCrosswordBedrockStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'IAM resources for Mini Crossword Generator Bedrock access',
  tags: {
    Project: 'MinigamePlatform',
    Component: 'CrosswordGenerator',
    ManagedBy: 'CDK',
  },
});

app.synth();
