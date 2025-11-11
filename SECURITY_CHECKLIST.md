# 🔒 Security Checklist Before Sharing GitHub Repository

## ⚠️ CRITICAL: Do NOT Share Until You Complete This Checklist

### 1. Remove Sensitive Files from Git History

These files contain **passwords and credentials** that are currently in your git history:

- ❌ `ADMIN_ACCOUNT_INFO.md` - Contains admin password
- ❌ `AGENCY_TEST_ACCOUNT.md` - Contains test account passwords  
- ❌ `TEST_ACCOUNT_RENTER.md` - Contains test account password

**Action Required:**
```bash
# Option 1: Remove files and clean history (RECOMMENDED)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ADMIN_ACCOUNT_INFO.md AGENCY_TEST_ACCOUNT.md TEST_ACCOUNT_RENTER.md" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Use BFG Repo-Cleaner (faster, recommended for large repos)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files ADMIN_ACCOUNT_INFO.md
java -jar bfg.jar --delete-files AGENCY_TEST_ACCOUNT.md
java -jar bfg.jar --delete-files TEST_ACCOUNT_RENTER.md
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### 2. Update .gitignore

Ensure these patterns are in `.gitignore`:
- `*ACCOUNT*.md` - Account info files
- `*TEST*.md` - Test account files
- `*.env*` - Environment files (already there ✅)
- `*SECRET*.md` - Secret documentation

### 3. Rotate All Exposed Credentials

**IMMEDIATELY change these passwords/keys:**

1. **Admin Account:**
   - Email: `rakb@rakb.ma`
   - Old Password: `Rakb@2025` → **CHANGE THIS NOW**

2. **Test Accounts:**
   - `hhadfi53@gmail.com` / `Bmx4ever` → **CHANGE THIS**
   - `agency@rakeb.test` / `Agency123!` → **CHANGE THIS**
   - `test-renter@rakb.test` / `TestRenter123!` → **CHANGE THIS**

3. **API Keys (if exposed):**
   - Check `MISSING_SECRETS.md` for any exposed keys
   - Rotate Resend API key if it was exposed
   - Rotate Stripe keys if exposed

### 4. Review Documentation Files

Check these files for sensitive information:
- `MISSING_SECRETS.md` - Contains API keys/URLs
- `FINAL_ENV_TEMPLATE.env.example` - Contains example keys
- `ENVIRONMENT_AUDIT_REPORT.md` - Contains Supabase URLs
- `ENVIRONMENT_VALIDATION_RESULTS.md` - Contains configuration

**Action:** Review and sanitize (remove actual keys, keep placeholders)

### 5. Verify No Hardcoded Secrets in Code

✅ **Good News:** Your code uses environment variables correctly:
- `src/lib/supabase.ts` - Uses `import.meta.env.VITE_SUPABASE_URL` ✅
- `src/integrations/supabase/client.ts` - Uses env vars ✅
- No hardcoded API keys found in source code ✅

### 6. Check for Exposed URLs/IDs

These are generally safe (public info):
- Supabase URL: `https://kcujctyosmjlofppntfb.supabase.co` (public, OK)
- Project IDs (public, OK)
- User IDs in documentation (consider removing)

### 7. Before Sharing Checklist

- [ ] Removed sensitive files from git history
- [ ] Updated .gitignore to prevent future commits
- [ ] Rotated all exposed passwords
- [ ] Rotated all exposed API keys
- [ ] Sanitized documentation files
- [ ] Verified no .env files are committed
- [ ] Created a clean branch for sharing (optional)
- [ ] Tested that sensitive info is not accessible

### 8. Safe Sharing Options

**Option A: Create a Clean Branch**
```bash
# Create a new branch without sensitive files
git checkout -b public-share
git rm ADMIN_ACCOUNT_INFO.md AGENCY_TEST_ACCOUNT.md TEST_ACCOUNT_RENTER.md
git commit -m "Remove sensitive account information"
# Share this branch only
```

**Option B: Create a New Repository**
```bash
# Clone to a new repo without history
git clone --depth 1 <your-repo-url> clean-repo
cd clean-repo
# Remove sensitive files
rm ADMIN_ACCOUNT_INFO.md AGENCY_TEST_ACCOUNT.md TEST_ACCOUNT_RENTER.md
# Create new repo and push
```

**Option C: Use GitHub's Private Fork**
- Keep main repo private
- Create a public fork
- Remove sensitive files from fork
- Share the fork URL

### 9. What's Safe to Share

✅ **Safe:**
- Source code (React/TypeScript)
- Component structure
- Database schema (without data)
- Configuration templates (with placeholders)
- Documentation (without credentials)
- Test files (without real credentials)

❌ **Never Share:**
- `.env` files
- Actual API keys
- Passwords
- Service role keys
- Production database credentials
- Admin account details

### 10. Post-Sharing Actions

After sharing:
1. Monitor repository access
2. Set up branch protection rules
3. Enable security alerts in GitHub
4. Review commit history regularly
5. Use GitHub's secret scanning

---

## 🚨 IMMEDIATE ACTION REQUIRED

**Before sharing your repository, you MUST:**

1. ✅ Remove sensitive files from git history
2. ✅ Rotate all exposed passwords
3. ✅ Rotate all exposed API keys
4. ✅ Update .gitignore
5. ✅ Sanitize documentation

**Current Status: ⚠️ NOT SAFE TO SHARE**

---

**Last Updated:** 2025-02-02
**Status:** 🔴 CRITICAL - Do not share until checklist is complete

