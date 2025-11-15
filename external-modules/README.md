# External Modules

This directory contains external infrastructure and tooling projects that support the minigame platform but are deployed and managed separately.

## Purpose

External modules are kept separate from the main application code (`frontend/` and `backend/`) because they:
- Deploy to different environments (e.g., AWS infrastructure vs Railway application)
- Have different deployment lifecycles
- Use different technology stacks
- Can be reused across multiple projects

## Current Modules

### mini-crossword-generator-bedrock/

AWS CDK infrastructure for provisioning Bedrock access for the crossword puzzle generator.

**What it does:**
- Creates IAM user with Bedrock permissions
- Generates access credentials
- Outputs environment variables for the backend

**Technology:** TypeScript + AWS CDK

**Deployment:** AWS CloudFormation (via CDK)

**See:** `mini-crossword-generator-bedrock/README.md` for details

## Adding New External Modules

When adding a new external module:

1. Create a new directory in `external-modules/`
2. Include a comprehensive README.md
3. Document deployment steps
4. Specify how it integrates with the main application
5. List any credentials or outputs needed

## Integration with Main Application

External modules typically:
- Output credentials or configuration values
- Are deployed once (or infrequently)
- Provide services consumed by backend/frontend
- Have their own version control and deployment process

The main application (`backend/` and `frontend/`) consumes these modules via:
- Environment variables
- API endpoints
- Configuration files

## Directory Structure

```
external-modules/
├── README.md                          # This file
└── mini-crossword-generator-bedrock/  # AWS Bedrock infrastructure
    ├── README.md                      # Module overview
    ├── QUICKSTART.md                  # Quick setup guide
    ├── DEPLOYMENT.md                  # Detailed deployment
    ├── INTEGRATION.md                 # Backend integration
    ├── bin/                           # CDK app entry
    ├── lib/                           # CDK stack definitions
    └── package.json                   # Dependencies
```

## Best Practices

1. **Independence:** Each module should be independently deployable
2. **Documentation:** Include comprehensive setup and integration docs
3. **Versioning:** Consider versioning for breaking changes
4. **Security:** Never commit credentials or secrets
5. **Testing:** Test modules in isolation before integration
6. **Cleanup:** Document how to tear down resources

## Questions?

For questions about specific modules, see their individual README files.
