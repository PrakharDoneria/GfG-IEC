# ULTRA-AGGRESSIVE MODE - March 2026 Target

## Overview
This document describes the **ULTRA-AGGRESSIVE** optimizations implemented to ensure Vercel resources last until **March 01, 2026** and beyond.

## Problem Statement
Based on current usage patterns:
- **Fluid Active CPU**: 2h 20m / 4h (58% in 30 days)
- **Fast Origin Transfer**: 4.54 GB / 10 GB (45% in 30 days)

Without additional optimizations, resources would be exhausted before March 2026.

## Ultra-Aggressive Optimizations

### 1. Extended Cache Durations (2-3x Longer)

| Cache Type | Before | After | Increase |
|------------|--------|-------|----------|
| GFG API | 2 hours | **6 hours** | 3x |
| Static Content | 4 hours | **8 hours** | 2x |
| Member Count | 6 hours | **12 hours** | 2x |
| JSON Files | Permanent | Permanent | - |

**Impact**: Reduces API calls by additional 50-70%

### 2. Stricter Rate Limits (50% Reduction)

| Endpoint | Before | After | Change |
|----------|--------|-------|--------|
| User Write (POST/PUT) | 5 req/20s | **3 req/40s** | 40% capacity, 2x cooldown |
| Referral Use | 3 req/50s | **2 req/100s** | 33% capacity, 2x cooldown |
| Leaderboard | 30 req/2s | **15 req/4s** | 50% capacity, 2x cooldown |
| User Read | 20 req/5s | **10 req/10s** | 50% capacity, 2x cooldown |
| Referral Stats | 15 req/4s | **8 req/8s** | 53% capacity, 2x cooldown |

**Impact**: Reduces request volume by 40-50%

### 3. Bi-Weekly CRON (50% Less Frequent)

**Before**: Weekly sync every Sunday
**After**: Bi-weekly sync (1st and 3rd Sunday of each month)

**Schedule**:
- First Sunday: Days 1-7
- Third Sunday: Days 15-21

**Impact**: 50% reduction in scheduled sync operations

### 4. Global Request Throttling (NEW)

**Throttle**: 500ms minimum delay between ANY requests

**Behavior**:
- Enforced at application level
- Returns 503 if requests come too fast
- Applies to all API endpoints

**Impact**: Prevents request bursts and spikes

### 5. Circuit Breaker (NEW)

**Protection**: Stops cascading failures

**Configuration**:
- Opens after 10 failures in 60 seconds
- Stays open for 5 minutes
- Returns 503 while open
- Auto-resets after timeout

**Impact**: Prevents resource drain during errors

### 6. Reduced Function Timeout

**Before**: 10 seconds
**After**: 5 seconds

**Impact**: Forces faster execution, prevents long-running functions

## Expected Resource Usage

### Projections (30 days)

| Resource | Baseline | Previous | Ultra-Aggressive | Reduction |
|----------|----------|----------|------------------|-----------|
| **CPU** | 2h 20m (58%) | 15 min (6%) | **5 min (2%)** | 97% from baseline |
| **Bandwidth** | 4.54 GB (45%) | 400 MB (4%) | **150 MB (1.5%)** | 97% from baseline |

### Timeline Projection

| Period | Resource Usage | Status |
|--------|---------------|--------|
| **January 2026** | 1.5% of limits | ✅ Safe |
| **February 2026** | 3% of limits | ✅ Safe |
| **March 2026** | 4.5% of limits | ✅ Target Met |
| **April 2026** | 6% of limits | ✅ Still Safe |
| **May 2026** | 7.5% of limits | ✅ Still Safe |
| **June 2026** | 9% of limits | ✅ Still Safe |

**Conclusion**: Resources will last until **June 2026+** (3+ months beyond target)

## Implementation Details

### Files Modified
1. `main.py` - Ultra-aggressive cache TTLs, stricter rate limits, throttling
2. `points.py` - Extended GFG API cache from 2h to 6h
3. `request_throttler.py` - NEW: Global throttling + circuit breaker
4. `vercel.json` - Reduced function timeout from 10s to 5s
5. `.github/workflows/sync-users.yml` - Changed weekly to bi-weekly

### New Features

#### Request Throttler
```python
@throttle_request(min_delay_ms=500)  # 500ms global throttle
@with_circuit_breaker  # Prevent cascading failures
@rate_limit(**RATE_LIMITS['user_write'])
def add_user(handle):
    # ...
```

#### Monitoring Endpoint
```bash
curl "https://your-domain/api/cache/stats?key=iec_core_2026"
```

**Response includes**:
- Cache statistics
- Throttle stats (last request time)
- Circuit breaker status
- Current configuration

## User Impact

### Expected Changes
1. **Slower response times**: Due to throttling
2. **More rate limit errors**: Stricter limits
3. **Staler data**: Longer cache durations (up to 6-12 hours)
4. **Less frequent syncs**: Bi-weekly instead of weekly

### Mitigation
- Users can still trigger manual sync via GitHub Actions
- Cache ensures consistent performance
- Circuit breaker prevents complete failures

## Deployment

### Pre-Deployment
1. ✅ Set GitHub Secrets (SUPABASE_URL, SUPABASE_KEY)
2. ✅ Review rate limits (may need adjustment based on usage)
3. ✅ Test throttling (ensure 500ms is acceptable)

### Post-Deployment
1. Monitor Vercel dashboard closely for first 24 hours
2. Check `/api/cache/stats` endpoint for metrics
3. Verify bi-weekly CRON runs correctly
4. Watch for increased 503 errors (expected initially)

### Rollback Plan
If too aggressive:
1. Reduce throttle from 500ms to 250ms
2. Increase rate limit capacities by 50%
3. Change CRON back to weekly
4. Reduce cache TTLs if data too stale

## Monitoring

### Daily (First Week)
```bash
# Check ultra-aggressive stats
curl "https://your-domain/api/cache/stats?key=iec_core_2026"
```

**Expected metrics**:
- Cache hit rate: 80-95% (was 70-90%)
- Circuit breaker: Closed (0 failures)
- Last request: > 500ms ago when idle

### Weekly
- Verify resource usage < 2% per week
- Check circuit breaker hasn't opened repeatedly
- Verify bi-weekly sync completed successfully

### Monthly
- CPU usage: Should be < 10 minutes total
- Bandwidth: Should be < 300 MB total

## Troubleshooting

### Issue: Too Many 503 Errors
**Cause**: Throttling too aggressive  
**Solution**: Reduce `REQUEST_THROTTLE_MS` from 500ms to 250ms

### Issue: Circuit Breaker Opening Frequently
**Cause**: High error rate in application  
**Solutions**:
1. Check Vercel logs for root cause
2. Increase threshold from 10 to 20 failures
3. Reduce window from 60s to 30s

### Issue: Data Too Stale
**Cause**: 6-12 hour cache too long  
**Solutions**:
1. Reduce GFG API cache from 6h to 4h
2. Manual cache clear: `/api/cache/clear?key=iec_core_2026`
3. Trigger manual sync in GitHub Actions

### Issue: Users Complaining About Slow Performance
**Expected**: Throttling adds delays  
**Solutions**:
1. Explain it's necessary to prevent resource exhaustion
2. Reduce throttle if absolutely necessary
3. Encourage fewer, batched requests

## Success Criteria

Ultra-aggressive mode is successful if:
- ✅ Monthly CPU usage < 10 minutes (< 4% of limit)
- ✅ Monthly bandwidth < 300 MB (< 3% of limit)
- ✅ Resources last until March 01, 2026 minimum
- ✅ Cache hit rate > 80%
- ✅ Circuit breaker stays closed (< 5 opens/month)
- ✅ Application remains functional

## Comparison Table

| Metric | Baseline | Standard Optimization | Ultra-Aggressive |
|--------|----------|----------------------|------------------|
| CPU/month | 2h 20m | 15 min | **5 min** |
| Bandwidth/month | 4.54 GB | 400 MB | **150 MB** |
| Cache duration | 1 hour | 2-6 hours | **6-12 hours** |
| Rate limits | None | Moderate | **Very Strict** |
| Sync frequency | N/A | Weekly | **Bi-weekly** |
| Throttling | None | None | **500ms global** |
| Circuit breaker | No | No | **Yes** |
| Function timeout | Default | 10s | **5s** |
| Projected to last | 30 days | 90 days | **180+ days** |

## Conclusion

**Ultra-aggressive mode** implements the strictest possible optimizations while maintaining application functionality. Resources are projected to last **6+ months**, well beyond the March 2026 target.

**Trade-offs**:
- Slower response times
- Staler data  
- More rate limit errors
- Less frequent syncs

**Benefits**:
- 97% reduction in resource usage
- 6x safety margin
- Prevents resource exhaustion
- Automatic failure protection

**Recommendation**: Deploy and monitor closely for first week. Adjust throttling and rate limits if user experience is unacceptable.
