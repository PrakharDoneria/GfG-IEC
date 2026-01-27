# Maintenance Mode Documentation

This document explains how to enable and disable maintenance mode for the GFG IEC Student Chapter Portal.

## Overview

The maintenance mode feature allows you to temporarily redirect all traffic to a maintenance page. This is useful when performing updates, database migrations, or any other maintenance activities that require taking the site offline.

## How It Works

The maintenance mode is implemented using Flask's `@app.before_request` middleware. When enabled:
- All incoming requests (except static files) are redirected to a maintenance page
- The maintenance page returns a 503 (Service Unavailable) HTTP status code
- Static files continue to be served to properly display the maintenance page

## Enabling Maintenance Mode

### Option 1: Using Environment Variable (Recommended)

#### For Local Development:

1. Create or edit the `.env` file in the project root:
```bash
MAINTENANCE_MODE=true
```

2. Restart the Flask application:
```bash
python main.py
```

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `MAINTENANCE_MODE`
   - **Value**: `true`
   - **Environment**: Select Production, Preview, or both as needed
4. Click **Save**
5. Redeploy your application or wait for the next deployment

### Option 2: Using Vercel Edge Config (Advanced)

For more dynamic control without redeployment, you can use Vercel Edge Config:

1. Create an Edge Config in your Vercel dashboard
2. Add a key `maintenance_mode` with value `true` or `false`
3. Update `main.py` to read from Edge Config (requires additional implementation)

## Disabling Maintenance Mode

### For Local Development:

1. Edit the `.env` file:
```bash
MAINTENANCE_MODE=false
```
Or simply remove/comment out the line:
```bash
# MAINTENANCE_MODE=true
```

2. Restart the Flask application

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Either:
   - Change `MAINTENANCE_MODE` value to `false`
   - Or delete the `MAINTENANCE_MODE` environment variable entirely
4. Redeploy your application

## Testing Maintenance Mode Locally

1. Set `MAINTENANCE_MODE=true` in your `.env` file
2. Run the application:
```bash
python main.py
```
3. Visit `http://localhost:5000` - you should see the maintenance page
4. Verify that static files are still accessible (check browser console for CSS/JS errors)

## Customizing the Maintenance Page

The maintenance page is located at:
```
templates/maintenance.html
```

You can customize:
- The message text
- Contact information
- Styling (colors, fonts, animations)
- Logo and branding

## Important Notes

1. **503 Status Code**: The maintenance page returns HTTP 503, which tells search engines and crawlers that the downtime is temporary.

2. **Static Files**: Static files (CSS, JS, images) continue to be served to ensure the maintenance page displays correctly.

3. **No Caching**: Make sure to clear browser cache when testing to see changes immediately.

4. **API Endpoints**: When maintenance mode is enabled, all API endpoints will also return the maintenance page. Plan accordingly.

## Troubleshooting

### Maintenance page not showing:

- Check that `MAINTENANCE_MODE=true` is set correctly
- Ensure the application has been restarted after changing the environment variable
- Clear browser cache and hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Static files not loading on maintenance page:

- Verify that the `check_maintenance_mode()` function correctly exempts `/static/` paths
- Check browser console for any 404 errors

### Still seeing maintenance page after disabling:

- Confirm `MAINTENANCE_MODE` is set to `false` or removed
- Restart the application
- Clear browser cache
- For Vercel: ensure the new environment variable is saved and redeployed

## Best Practices

1. **Announce in advance**: Notify users before enabling maintenance mode
2. **Keep it brief**: Minimize downtime
3. **Update contact info**: Ensure the maintenance page has current contact information
4. **Test first**: Test maintenance mode on a preview/staging environment before production
5. **Monitor**: Keep an eye on traffic and error logs during maintenance

## Architecture Details

The maintenance mode is implemented in `main.py`:

```python
# Configuration
MAINTENANCE_MODE = os.getenv("MAINTENANCE_MODE", "false").lower() == "true"

# Middleware
@app.before_request
def check_maintenance_mode():
    if MAINTENANCE_MODE:
        # Allow static files and maintenance page itself
        if request.path.startswith('/static/') or request.endpoint == 'maintenance_page':
            return None
        # Redirect everything else
        return render_template('maintenance.html'), 503
```

This approach:
- ✅ Is simple and lightweight
- ✅ Requires no external dependencies
- ✅ Works with both local and Vercel deployments
- ✅ Returns proper HTTP status codes
- ✅ Allows static files for proper rendering

## Alternative Approaches

### 1. Vercel Redirects (vercel.json)
You could use Vercel's routing configuration, but this would require redeployment to enable/disable.

### 2. Vercel Edge Config
More dynamic but requires additional setup and API calls.

### 3. Cloudflare Workers
If using Cloudflare, you can implement maintenance mode at the edge level.

The current implementation (environment variable + Flask middleware) provides the best balance of simplicity and flexibility.
