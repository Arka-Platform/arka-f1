#!/bin/bash

# Script to set up and push to GitHub repository
# Repository name: arka-platform-git

set -e

REPO_NAME="arka-platform-git"
GITHUB_USER=""

echo "========================================="
echo "GitHub Repository Setup"
echo "========================================="
echo ""

# Get GitHub username
if [ -z "$GITHUB_USER" ]; then
    read -p "Enter your GitHub username: " GITHUB_USER
fi

if [ -z "$GITHUB_USER" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

echo "Repository: $GITHUB_USER/$REPO_NAME"
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote -v
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
        echo "✅ Remote updated"
    else
        echo "Keeping existing remote"
    fi
else
    # Add remote
    echo "Adding remote repository..."
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "✅ Remote added"
fi

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Create the repository on GitHub:"
echo "   Go to: https://github.com/new"
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
    echo "1. Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/secrets/actions"
    echo "2. Add secrets:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "See SETUP_GITHUB.md for detailed instructions"
fi

