# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 18+** and npm installed
4. **Bedrock Access** enabled in your AWS account

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd mini-crossword-generator-bedrock
npm install
```

### 2. Configure AWS Credentials

If not already configured:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### 3. Enable Bedrock Model Access

1. Go to AWS Console → Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access for:
   - Anthropic Claude 3 Haiku
   - (Optional) Anthropic Claude 3.5 Sonnet
   - (Optional) Meta Llama 3.1 70B

**Note:** Model access approval is usually instant but can take a few minutes.

### 4. Bootstrap CDK (First Time Only)

If this is your first CDK deployment in this account/region:

```bash
npx cdk bootstrap
```

This creates necessary S3 buckets and IAM roles for CDK.

### 5. Review the Stack

Preview what will be created:

```bash
npx cdk synth
```

Or see the differences:

```bash
npx cdk diff
```

### 6. Deploy the Stack

```bash
npx cdk deploy
```

You'll see a confirmation prompt. Type `y` to proceed.

### 7. Save the Outputs

After deployment completes, you'll see outputs like:

```
Outputs:
MiniCrosswordBedrockStack.AccessKeyId = AKIA...
MiniCrosswordBedrockStack.SecretAccessKey = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
MiniCrosswordBedrockStack.Region = us-east-1
MiniCrosswordBedrockStack.RecommendedModelId = anthropic.claude-3-haiku-20240307-v1:0
```

**IMPORTANT:** Copy the `SecretAccessKey` immediately - it cannot be retrieved later!

### 8. Configure Minigame Platform

Add these environment variables to your Railway project:

```bash
AWS_ACCESS_KEY_ID=<AccessKeyId from output>
AWS_SECRET_ACCESS_KEY=<SecretAccessKey from output>
AWS_REGION=<Region from output>
BEDROCK_MODEL_ID=<RecommendedModelId from output>
```

In Railway:
1. Go to your project
2. Click on the backend service
3. Go to "Variables" tab
4. Add each variable
5. Redeploy the service

### 9. Verify Deployment

Check that resources were created:

```bash
# List IAM users
aws iam list-users | grep minigame-crossword-bedrock-user

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name MiniCrosswordBedrockStack
```

## Testing the Integration

Once deployed and configured, test the Bedrock integration:

```python
# In your backend, you can test with:
import boto3
import json

client = boto3.client(
    'bedrock-runtime',
    region_name='us-east-1',
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY'
)

response = client.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 100,
        "messages": [{"role": "user", "content": "Hello!"}]
    })
)

print(json.loads(response['body'].read()))
```

## Updating the Stack

If you make changes to the CDK code:

```bash
npx cdk diff    # Preview changes
npx cdk deploy  # Apply changes
```

## Cleanup

To remove all resources and stop incurring costs:

```bash
npx cdk destroy
```

This will delete:
- IAM user
- IAM policy
- Access key

**Warning:** This will invalidate the credentials used by your minigame platform!

## Troubleshooting

### Error: "User already exists"

If the IAM user already exists from a previous deployment:

1. Delete the user manually in AWS Console
2. Or change the username in `lib/bedrock-stack.ts`
3. Redeploy

### Error: "Access Denied" when invoking Bedrock

1. Verify model access is enabled in Bedrock console
2. Check that the IAM policy is attached to the user
3. Verify you're using the correct region
4. Ensure the model ID is correct

### Error: "Model not found"

The model might not be available in your region. Try:
- `us-east-1` (N. Virginia)
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)

### Error: "ThrottlingException"

You're hitting rate limits. The backend should automatically retry with exponential backoff.

## Cost Monitoring

Monitor your Bedrock usage:

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name InvocationCount \
  --dimensions Name=ModelId,Value=anthropic.claude-3-haiku-20240307-v1:0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

Or check in AWS Console → Bedrock → Usage

## Security Best Practices

1. **Rotate credentials** periodically (every 90 days)
2. **Use AWS Secrets Manager** for production (optional enhancement)
3. **Enable CloudTrail** to audit Bedrock API calls
4. **Set up billing alerts** in AWS Console
5. **Never commit credentials** to git

## Support

For issues:
- **CDK deployment**: Check CloudFormation console for detailed errors
- **Bedrock access**: Verify model access in Bedrock console
- **IAM permissions**: Check IAM console for policy attachments
- **Integration**: Check backend logs in Railway

## Next Steps

After successful deployment:
1. ✅ Credentials configured in Railway
2. ✅ Backend can call Bedrock API
3. → Implement crossword generator service (Task 18)
4. → Test puzzle generation
5. → Deploy to production
