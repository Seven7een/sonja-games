# Quick Start Guide

Get up and running with AWS Bedrock for crossword generation in 5 minutes.

## Prerequisites Checklist

- [ ] AWS account
- [ ] AWS CLI installed (`aws --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Bedrock access enabled in AWS Console

## 5-Minute Setup

### 1. Enable Bedrock Access (2 minutes)

```bash
# Open AWS Console
open https://console.aws.amazon.com/bedrock

# Navigate to: Bedrock → Model access → Manage model access
# Enable: Anthropic Claude 3 Haiku
# Click: Save changes
```

### 2. Deploy Infrastructure (2 minutes)

```bash
# Install dependencies
npm install

# Configure AWS (if needed)
aws configure

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy stack
npx cdk deploy
```

Type `y` when prompted.

### 3. Save Credentials (1 minute)

Copy the outputs:

```
AccessKeyId = AKIA...
SecretAccessKey = wJalr...
Region = us-east-1
RecommendedModelId = anthropic.claude-3-haiku-20240307-v1:0
```

**IMPORTANT:** Save `SecretAccessKey` now - you can't retrieve it later!

### 4. Configure Minigame Platform

Add to Railway environment variables:

```bash
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

Done! 🎉

## Verify It Works

Test the integration:

```python
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
        "messages": [{"role": "user", "content": "Say hello!"}]
    })
)

result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

Should print: "Hello! How can I assist you today?"

## Common Issues

### "Access Denied"
→ Enable model access in Bedrock console

### "User already exists"
→ Delete existing user or change name in `lib/bedrock-stack.ts`

### "Region not supported"
→ Use `us-east-1` or `us-west-2`

## Cost

- **Per puzzle:** ~$0.0015
- **Monthly:** ~$0.045 (30 puzzles)
- **Yearly:** ~$0.54

Extremely cheap! 💰

## Next Steps

1. ✅ Infrastructure deployed
2. ✅ Credentials configured
3. → Implement backend integration (see INTEGRATION.md)
4. → Test puzzle generation
5. → Deploy to production

## Need Help?

- **Deployment issues:** See DEPLOYMENT.md
- **Integration code:** See INTEGRATION.md
- **Full details:** See README.md

## Cleanup

To remove everything:

```bash
npx cdk destroy
```

This deletes all resources and stops any costs.
