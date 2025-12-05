#!/bin/bash

# Script to help update AWS credentials
# Usage: ./update-aws-credentials.sh [profile-name]

set -e

PROFILE="${1:-default}"

echo "🔐 AWS Credentials Update Helper"
echo "================================"
echo ""
echo "Your current credentials are invalid or expired."
echo ""
echo "To fix this, you need to:"
echo ""
echo "1. Go to AWS Console: https://console.aws.amazon.com/"
echo "2. Sign in to account: 600751737236"
echo "3. Go to IAM → Users → Your User → Security credentials"
echo "4. Create a new access key (or use existing if not expired)"
echo ""
echo "Then run one of these commands:"
echo ""
echo "Option 1: Update default profile"
echo "  aws configure"
echo ""
echo "Option 2: Update specific profile"
echo "  aws configure --profile $PROFILE"
echo ""
echo "Option 3: Set via environment variables"
echo "  export AWS_ACCESS_KEY_ID='your-access-key'"
echo "  export AWS_SECRET_ACCESS_KEY='your-secret-key'"
echo "  export AWS_DEFAULT_REGION='us-east-1'"
echo ""
echo "After updating, verify with:"
echo "  aws sts get-caller-identity"
echo ""

# Check if they want to update now
read -p "Do you want to update credentials now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Updating profile: $PROFILE"
    aws configure --profile "$PROFILE"
    
    echo ""
    echo "Verifying credentials..."
    if aws sts get-caller-identity --profile "$PROFILE" 2>/dev/null; then
        echo ""
        echo "✅ Credentials are valid!"
        echo ""
        echo "To use this profile with Terraform, set:"
        echo "  export AWS_PROFILE=$PROFILE"
    else
        echo ""
        echo "❌ Credentials are still invalid. Please check your access key and secret key."
    fi
fi

