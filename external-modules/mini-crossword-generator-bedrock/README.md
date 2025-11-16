# Mini Crossword Generator - AWS Bedrock Infrastructure

AWS CDK stack for provisioning Bedrock access for the Minigame Platform's crossword generator.

## Overview

This CDK project creates the necessary AWS infrastructure to enable the minigame platform to generate crossword puzzles using AWS Bedrock (Claude 3 Haiku).

## What This Creates

- **IAM User**: `minigame-bedrock-user` with programmatic access
- **IAM Policy**: Grants `bedrock:InvokeModel` permission for specific models
- **Access Key**: For authenticating API calls from the minigame platform

## Prerequisites

- AWS CLI configured with credentials
- Node.js 18+ and npm
- AWS account with Bedrock access enabled in your region
- CDK CLI: `npm install -g aws-cdk`

## Quick Start

1. **Enable Bedrock model access** in AWS Console (Bedrock → Model access → Enable Claude 3 Haiku)

2. **Install and deploy:**
   ```bash
   npm install
   aws configure  # If not already configured
   npx cdk bootstrap  # First time only
   npx cdk deploy
   ```

3. **Save the outputs** (especially `SecretAccessKey` - can't retrieve later!)

4. **Add to Railway** environment variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `BEDROCK_MODEL_ID`

That's it! The backend can now generate crossword puzzles using Bedrock.

## Configure Minigame Platform

After deployment, add these environment variables to your Railway project:

```bash
AWS_ACCESS_KEY_ID=<AccessKeyId from output>
AWS_SECRET_ACCESS_KEY=<SecretAccessKey from output>
AWS_REGION=<Region from output>
BEDROCK_MODEL_ID=<RecommendedModelId from output>
```

## Available Models

The stack grants access to these Bedrock models:

| Model | ID | Cost (per 1K tokens) | Use Case |
|-------|----|--------------------|----------|
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | $0.00025 / $0.00125 | **Recommended** - Fast, cheap, good quality |
| Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20240620-v1:0` | $0.003 / $0.015 | Best quality, more expensive |
| Llama 3 70B | `meta.llama3-70b-instruct-v1:0` | $0.00099 / $0.00099 | Open source alternative |

**Default:** Claude 3 Haiku (best cost/quality balance)

## Cost Estimate

- **Per puzzle:** ~$0.0015
- **Monthly (30 puzzles):** ~$0.045
- **Yearly:** ~$0.54

Extremely cost-effective for daily puzzle generation!

## Useful Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npx cdk deploy` - Deploy stack to AWS
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk synth` - Synthesize CloudFormation template
- `npx cdk destroy` - Remove all resources

## Security

- IAM user has **least privilege** - only `bedrock:InvokeModel` permission
- Access limited to specific model ARNs
- No other AWS services accessible
- Credentials should be stored securely (Railway secrets, not in code)

## Cleanup

To remove all resources and stop incurring any costs:

```bash
npx cdk destroy
```

This will delete:
- IAM user
- IAM policy
- Access key

## Troubleshooting

### Bedrock Access Denied

If you get access denied errors:
1. Ensure Bedrock is enabled in your AWS account
2. Check that you're deploying to a region where Bedrock is available (us-east-1, us-west-2, etc.)
3. Request model access in the AWS Bedrock console

### Access Key Not Working

1. Verify the access key and secret are correct
2. Check the IAM user exists in AWS console
3. Verify the policy is attached to the user
4. Ensure the region matches

## Support

For issues with:
- **CDK deployment**: Check AWS CloudFormation console for error details
- **Bedrock access**: Verify model access in AWS Bedrock console
- **Minigame integration**: Check the minigame platform backend logs

## License

MIT
