#!/bin/bash

# Script to set up and push to GitHub repository

set -e

GITHUB_ORG="Arka-Platform"

echo "========================================="
echo "GitHub Repository Setup"
echo "========================================="
echo ""

# Get repository name
read -p "Enter repository name: " REPO_NAME

if [ -z "$REPO_NAME" ]; then
    echo "❌ Repository name is required"
    exit 1
fi

echo "Organization: $GITHUB_ORG"
echo "Repository: $REPO_NAME"
echo "Full path: $GITHUB_ORG/$REPO_NAME"
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    CURRENT_URL=$(git remote get-url origin)
    EXPECTED_URL="https://github.com/$GITHUB_ORG/$REPO_NAME.git"
    
    if [ "$CURRENT_URL" != "$EXPECTED_URL" ]; then
        echo "⚠️  Remote 'origin' currently points to:"
        echo "   $CURRENT_URL"
        echo ""
        echo "Expected: $EXPECTED_URL"
        echo ""
        read -p "Do you want to update it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$EXPECTED_URL"
            echo "✅ Remote updated to $GITHUB_ORG/$REPO_NAME"
        else
            echo "Keeping existing remote"
        fi
    else
        echo "✅ Remote already configured correctly"
    fi
else
    # Add remote
    echo "Adding remote repository..."
    git remote add origin "https://github.com/$GITHUB_ORG/$REPO_NAME.git"
    echo "✅ Remote added: $GITHUB_ORG/$REPO_NAME"
fi

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Create the repository in the Arka-Platform organization:"
echo "   Go to: https://github.com/organizations/Arka-Platform/repositories/new"
echo "   Or: https://github.com/new (select 'Arka-Platform' as owner)"
echo "   Repository name: $REPO_NAME"
echo "   Description: Arka Platform - Book Marketplace"
echo "   Visibility: Choose Public or Private"
echo "   ⚠️  DO NOT initialize with README, .gitignore, or license"
echo ""
echo "2. After creating the repository, run:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Or run this script again with --push flag:"
echo "   ./setup-github-repo.sh --push"
echo ""

# Check if --push flag is provided
if [ "$1" == "--push" ]; then
    echo "Pushing to GitHub..."
    git branch -M main 2>/dev/null || true
    git push -u origin main
    echo ""
    echo "✅ Code pushed to GitHub!"
    echo ""
    echo "Next: Configure GitHub Actions secrets:"
    echo "1. Go to: https://github.com/$GITHUB_ORG/$REPO_NAME/settings/secrets/actions"
    echo "2. Add secrets:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "See SETUP_GITHUB.md for detailed instructions"
fi

