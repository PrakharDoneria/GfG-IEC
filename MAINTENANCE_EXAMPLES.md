# Maintenance Mode - Quick Start Examples

This file contains practical examples for using the maintenance mode feature.

## Example 1: Enable Maintenance Mode Locally

```bash
# Add to .env file
echo "MAINTENANCE_MODE=true" >> .env

# Restart the application
python main.py
```

Visit `http://localhost:5000` - you'll see the maintenance page.

## Example 2: Disable Maintenance Mode Locally

```bash
# Edit .env file and change to false
sed -i 's/MAINTENANCE_MODE=true/MAINTENANCE_MODE=false/' .env

# Or remove the line entirely
sed -i '/MAINTENANCE_MODE/d' .env

# Restart the application
python main.py
```

## Example 3: Enable Maintenance Mode on Vercel (via CLI)

```bash
# Set the environment variable
vercel env add MAINTENANCE_MODE

# When prompted:
# - Value: true
# - Environment: Production (or Preview, Development as needed)

# Redeploy
vercel --prod
```

## Example 4: Enable Maintenance Mode on Vercel (via Dashboard)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Set:
   - **Name**: `MAINTENANCE_MODE`
   - **Value**: `true`
   - **Environment**: Production ✓
6. Click **Save**
7. Go to **Deployments** and click **Redeploy** on the latest deployment

## Example 5: Temporary Maintenance (One-time)

For a quick temporary maintenance without editing files:

```bash
# Start with maintenance mode on
MAINTENANCE_MODE=true python main.py

# When done, restart normally
python main.py
```

## Example 6: Check Current Status

```bash
# Check if maintenance mode is enabled in your .env
grep MAINTENANCE_MODE .env

# For Vercel, check via CLI
vercel env ls
```

## Example 7: Schedule Maintenance

Create a script to enable/disable maintenance at specific times:

```bash
#!/bin/bash
# enable_maintenance.sh

# Enable maintenance
vercel env add MAINTENANCE_MODE production
# Enter 'true' when prompted

# Trigger redeploy
vercel --prod

echo "Maintenance mode enabled. Perform your updates."
echo "Run disable_maintenance.sh when done."
```

```bash
#!/bin/bash
# disable_maintenance.sh

# Remove maintenance mode
vercel env rm MAINTENANCE_MODE production

# Trigger redeploy
vercel --prod

echo "Maintenance mode disabled. Site is back online."
```

## Example 8: Preview Maintenance Page (Without Enabling Mode)

You can preview the maintenance page without enabling maintenance mode:

```bash
# Start the app normally (MAINTENANCE_MODE=false or not set)
python main.py

# Visit http://localhost:5000/maintenance
```

This shows you the maintenance page with 200 status (not 503).

## Example 9: Testing in Different Environments

```bash
# Development environment
vercel env add MAINTENANCE_MODE development
# Value: true

# Preview environment  
vercel env add MAINTENANCE_MODE preview
# Value: false

# Production environment
vercel env add MAINTENANCE_MODE production
# Value: false
```

This way you can test maintenance mode in development without affecting production.

## Example 10: Docker Deployment

If running in Docker:

```bash
# Start with maintenance mode
docker run -e MAINTENANCE_MODE=true -p 5000:5000 your-image

# Start normally
docker run -e MAINTENANCE_MODE=false -p 5000:5000 your-image
```

Or in docker-compose.yml:
```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MAINTENANCE_MODE=false
```

## Tips

1. **Always test first**: Test maintenance mode in a preview/staging environment before production
2. **Inform users**: Send notifications before enabling maintenance mode
3. **Keep it brief**: Plan maintenance during low-traffic periods
4. **Monitor**: Check logs and status after enabling/disabling
5. **Documentation**: Update your team's runbook with these commands

## Troubleshooting

**Problem**: Maintenance page not showing after enabling

**Solution**:
```bash
# Verify environment variable is set
echo $MAINTENANCE_MODE  # Should output: true

# Check .env file
cat .env | grep MAINTENANCE

# Restart application
pkill -f "python main.py"
python main.py
```

**Problem**: Site still in maintenance after disabling

**Solution**:
```bash
# Make sure variable is removed or set to false
unset MAINTENANCE_MODE
# or
export MAINTENANCE_MODE=false

# Hard restart
python main.py
```

For more details, see [MAINTENANCE_MODE.md](./MAINTENANCE_MODE.md)
