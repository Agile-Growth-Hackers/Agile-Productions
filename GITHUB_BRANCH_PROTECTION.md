# GitHub Branch Protection Setup

Protect your main branch to prevent accidental pushes and ensure code quality through required reviews and status checks.

## Why Branch Protection?

- Prevents force pushes and deletions of main branch
- Requires pull request reviews before merging
- Ensures CI/CD tests pass before merging
- Enforces consistent code quality standards

## Setup Instructions (5 minutes)

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository: https://github.com/Agile-Growth-Hackers/Agile-Productions
2. Click on **Settings** (top navigation)
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule** or **Add branch protection rule**

### 2. Configure Protection Rules

**Branch name pattern:** `main`

Enable these settings:

#### Required Settings:
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Search and select these status checks:
    - `build-and-test` (Frontend CI/CD workflow)
    - `deploy` (Deployment workflow - optional)

- ✅ **Require conversation resolution before merging**
  - Ensures all PR comments are addressed

#### Recommended Settings:
- ✅ **Do not allow bypassing the above settings**
  - Even admins must follow these rules

- ✅ **Restrict who can push to matching branches**
  - Only allow specific people/teams to push directly (if needed)
  - Recommended: Leave empty to require PRs for everyone

#### Optional Settings:
- **Require signed commits** (if your team uses GPG signing)
- **Include administrators** (makes rules apply to admins too - recommended)

### 3. Save Changes

Click **Create** or **Save changes** at the bottom of the page.

## Testing Your Setup

1. Try to push directly to main:
   ```bash
   # This should now fail
   git push origin main
   ```

2. Create a new branch instead:
   ```bash
   git checkout -b feature/test-branch-protection
   # Make changes
   git add .
   git commit -m "Test: verify branch protection"
   git push origin feature/test-branch-protection
   ```

3. Create a pull request on GitHub
4. Verify that:
   - CI/CD checks must pass
   - At least 1 approval is required
   - You cannot merge without meeting requirements

## Workflow After Setup

Moving forward, all changes should follow this process:

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Add your feature"
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request:**
   - Go to GitHub repository
   - Click "Compare & pull request"
   - Fill in description
   - Request review if needed

4. **Wait for checks:**
   - CI/CD tests must pass
   - Get required approvals

5. **Merge to main:**
   - Click "Merge pull request"
   - Automatic deployment will trigger

## Emergency Bypass (Use Sparingly)

If you absolutely must bypass protection (emergencies only):

1. Go to Settings > Branches
2. Temporarily disable the rule
3. Make your urgent change
4. Re-enable the rule immediately

**Note:** If "Do not allow bypassing" is enabled, even admins cannot bypass (recommended for production).

## Benefits Gained

✅ Code quality enforcement
✅ Prevents accidental main branch damage
✅ Required CI/CD validation
✅ Audit trail of all changes
✅ Collaborative code review
✅ Professional development workflow

Your main branch is now protected! All future changes will require pull requests and passing CI/CD checks.
