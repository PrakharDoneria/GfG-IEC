# Deployment Checklist - Vercel Resource Optimization

## Pre-Deployment Checklist

### 1. GitHub Secrets Configuration
Before deploying, ensure these secrets are set in GitHub repository settings:
- [ ] Navigate to: Settings → Secrets and variables → Actions
- [ ] Add `SUPABASE_URL` (from Supabase project settings)
- [ ] Add `SUPABASE_KEY` (anon/public key from Supabase)

**How to find these values:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy "Project URL" → Set as `SUPABASE_URL`
4. Copy "anon public" key → Set as `SUPABASE_KEY`

### 2. Verify GitHub Actions Workflow
- [ ] Check `.github/workflows/sync-users.yml` is committed
- [ ] Go to GitHub → Actions tab
- [ ] Verify "Sync GFG Users (Weekly)" workflow appears
- [ ] Test manual trigger: Actions → "Sync GFG Users (Weekly)" → "Run workflow"
- [ ] Check logs to ensure it runs successfully

### 3. Local Testing (Optional)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="your_url"
export SUPABASE_KEY="your_key"

# Test server startup
python main.py

# In another terminal, test endpoints
curl http://localhost:5000/
curl http://localhost:5000/api/leaderboard
```

### 4. Vercel Deployment
- [ ] Push changes to GitHub (already done via this PR)
- [ ] Vercel will auto-deploy from the branch
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

### 5. Post-Deployment Verification

#### Test Core Functionality
- [ ] Visit homepage: `https://your-domain.vercel.app/`
- [ ] Check leaderboard: `https://your-domain.vercel.app/leaderboard`
- [ ] Test API: `https://your-domain.vercel.app/api/leaderboard`

#### Test Rate Limiting
```bash
# Should succeed first few times
for i in {1..3}; do curl https://your-domain.vercel.app/api/leaderboard; echo; done

# Should eventually return 429 Rate Limit Exceeded
for i in {1..50}; do curl https://your-domain.vercel.app/api/leaderboard; echo; done
```

#### Test Caching (Admin Only)
```bash
# Check cache stats
curl "https://your-domain.vercel.app/api/cache/stats?key=iec_core_2026"

# Expected response:
# {
#   "cache_stats": {
#     "hits": 123,
#     "misses": 45,
#     "evictions": 0,
#     "size": 67,
#     "hit_rate": "73.21%"
#   }
# }
```

#### Test Disabled Endpoint
```bash
# Should return 410 Gone
curl https://your-domain.vercel.app/api/admin/sync-all

# Expected:
# {
#   "error": "This endpoint has been disabled to conserve Vercel resources.",
#   "message": "User syncing now happens automatically via scheduled CRON jobs."
# }
```

### 6. Monitor Resource Usage

#### First 24 Hours
- [ ] Check Vercel dashboard after 1 hour
- [ ] Verify CPU usage is minimal
- [ ] Verify data transfer is reduced
- [ ] Check for any errors in logs

#### After 1 Week
- [ ] Verify GitHub Actions CRON job ran on Sunday
- [ ] Check job logs: Actions → "Sync GFG Users (Weekly)" → Latest run
- [ ] Compare resource usage to pre-optimization baseline
- [ ] Verify users are being synced correctly

#### Monthly Check
- [ ] Monitor Vercel resource usage dashboard
- [ ] Ensure staying under limits:
  - Fluid Active CPU: < 50% of 4h limit (target: < 20 minutes)
  - Fast Origin Transfer: < 50% of 10 GB limit (target: < 1 GB)

### 7. Cache Performance Monitoring

Track cache hit rate over time:
```bash
# Check daily
curl "https://your-domain.vercel.app/api/cache/stats?key=iec_core_2026"
```

**Healthy metrics:**
- Hit rate: > 70%
- Size: < 500 entries
- Evictions: < 100/day

**If hit rate < 50%:** Consider increasing TTL values

### 8. CRON Job Maintenance

#### Verify Weekly Sync
1. Check GitHub Actions every Monday
2. Verify last run completed successfully
3. Check number of users synced vs total users
4. Ensure no major errors (few failures are OK)

#### Manual Sync (Emergency Only)
If immediate sync needed:
1. Go to GitHub → Actions
2. Select "Sync GFG Users (Weekly)"
3. Click "Run workflow"
4. Monitor progress in logs

**⚠️ Warning:** Manual syncs count against your quotas. Use sparingly.

## Troubleshooting

### Issue: High CPU Usage After Deployment
**Possible causes:**
- Cache not working (check cache stats)
- Rate limiter not active (test rate limiting)
- CRON job running too frequently

**Solutions:**
1. Check cache hit rate
2. Increase TTL values in `main.py`
3. Verify CRON schedule is weekly, not daily

### Issue: Users Not Syncing
**Possible causes:**
- GitHub Secrets not set
- CRON job failed
- Supabase credentials expired

**Solutions:**
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Test Supabase connection manually

### Issue: 429 Rate Limit Errors
**Expected behavior:** This protects your resources!

**If too aggressive:**
1. Edit `rate_limiter.py`
2. Increase `capacity` or `refill_rate` for specific endpoints
3. Redeploy

### Issue: Stale Data
**Normal:** Data can be up to 2 hours old (by design)

**If problematic:**
1. Reduce TTL in `points.py`: `@cached(ttl=3600)` (1 hour)
2. Reduce cache TTL in `main.py`
3. Redeploy

## Rollback Plan

If optimizations cause issues:

1. **Quick rollback:**
   ```bash
   git revert HEAD~2  # Revert last 2 commits
   git push origin <branch-name>
   ```

2. **Partial rollback - Disable rate limiting:**
   - Comment out `@rate_limit()` decorators in `main.py`
   - Redeploy

3. **Partial rollback - Disable caching:**
   - Set all TTL values to 0
   - Redeploy

## Success Criteria

Deployment is successful if:
- ✅ All pages load correctly
- ✅ API endpoints respond (with rate limiting)
- ✅ Cache hit rate > 60% after 24 hours
- ✅ CPU usage < 30 minutes/month
- ✅ Data transfer < 1 GB/month
- ✅ Weekly CRON job runs successfully
- ✅ No breaking changes to user experience

## Contact

For issues:
1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Review `OPTIMIZATION.md` for details
4. Create GitHub issue with logs if needed
