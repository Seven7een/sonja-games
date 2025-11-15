import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BedrockAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IAM User for programmatic access to Bedrock
    const bedrockUser = new iam.User(this, 'MinigameBedrockUser', {
      userName: 'minigame-crossword-bedrock-user',
    });

    // Policy granting access to invoke Bedrock models
    const bedrockPolicy = new iam.Policy(this, 'BedrockInvokePolicy', {
      policyName: 'MinigameCrosswordBedrockInvokePolicy',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowBedrockModelInvocation',
          effect: iam.Effect.ALLOW,
          actions: [
            'bedrock:InvokeModel',
            'bedrock:InvokeModelWithResponseStream',
          ],
          resources: [
            // Anthropic Claude 3 Haiku - Recommended (fast, cheap, good quality)
            `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
            
            // Anthropic Claude 3.5 Sonnet - Premium option (best quality)
            `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`,
            
            // Meta Llama 3 70B Instruct - Open source alternative
            `arn:aws:bedrock:${this.region}::foundation-model/meta.llama3-70b-instruct-v1:0`,
            
            // Meta Llama 3.1 70B Instruct - Newer version
            `arn:aws:bedrock:${this.region}::foundation-model/meta.llama3-1-70b-instruct-v1:0`,
          ],
        }),
      ],
    });

    // Attach policy to user
    bedrockPolicy.attachToUser(bedrockUser);

    // Create access key for programmatic access
    const accessKey = new iam.CfnAccessKey(this, 'BedrockAccessKey', {
      userName: bedrockUser.userName,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'AccessKeyId', {
      value: accessKey.ref,
      description: 'AWS Access Key ID for Bedrock API access',
      exportName: 'MinigameCrosswordBedrockAccessKeyId',
    });

    new cdk.CfnOutput(this, 'SecretAccessKey', {
      value: accessKey.attrSecretAccessKey,
      description: 'AWS Secret Access Key (SAVE THIS - cannot be retrieved later!)',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for Bedrock API calls',
      exportName: 'MinigameCrosswordBedrockRegion',
    });

    new cdk.CfnOutput(this, 'RecommendedModelId', {
      value: 'anthropic.claude-3-haiku-20240307-v1:0',
      description: 'Recommended Bedrock model ID (cost-effective, good quality)',
      exportName: 'MinigameCrosswordBedrockModelId',
    });

    new cdk.CfnOutput(this, 'AlternativeModelIdSonnet', {
      value: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      description: 'Alternative model: Claude 3.5 Sonnet (best quality, higher cost)',
    });

    new cdk.CfnOutput(this, 'AlternativeModelIdLlama', {
      value: 'meta.llama3-1-70b-instruct-v1:0',
      description: 'Alternative model: Llama 3.1 70B (open source)',
    });

    new cdk.CfnOutput(this, 'IAMUserName', {
      value: bedrockUser.userName,
      description: 'IAM User name (for reference)',
    });

    // Add helpful notes
    new cdk.CfnOutput(this, 'NextSteps', {
      value: 'Add AccessKeyId, SecretAccessKey, Region, and RecommendedModelId to Railway environment variables',
      description: 'Configuration instructions',
    });
  }
}
