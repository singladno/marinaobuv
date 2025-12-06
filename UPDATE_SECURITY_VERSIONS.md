# Security Updates - React and Next.js

## Updates Applied

Based on Yandex Smart Web Security recommendations:

### ✅ Updated Versions

1. **React**: `19.1.0` → `19.2.1`
2. **React DOM**: `19.1.0` → `19.2.1`
3. **Next.js**: `15.5.3` → `16.0.7` (latest recommended)
4. **ESLint Config Next**: `15.5.3` → `16.0.7`

## Next Steps

### 1. Install Updated Dependencies

```bash
cd web
npm install
```

### 2. Test the Application

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Test build
npm run build
```

### 3. Deploy to Server

After testing locally:

```bash
# Commit changes
git add web/package.json web/package-lock.json
git commit -m "Security: Update React to 19.2.1 and Next.js to 16.0.7"

# Push and deploy
git push
# Then deploy via your normal process
```

### 4. Yandex Smart Web Security

The document mentions connecting Yandex Smart Web Security with WAF rule `yars-v0.1.0-id8080234-attack-rce`.

This is typically configured at the cloud/infrastructure level:

1. **Yandex Cloud Console**:
   - Go to Application Load Balancer or Cloud CDN
   - Enable Smart Web Security
   - The WAF rule `yars-v0.1.0-id8080234-attack-rce` should be automatically included

2. **Check Current Setup**:
   - Verify if you're using Yandex Cloud Load Balancer
   - Check if Smart Web Security is enabled
   - Review WAF rules in the console

## Breaking Changes to Watch For

### Next.js 16.0.7

Next.js 16 may have some breaking changes from 15.5.3:

- Check the [Next.js 16 migration guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
- Review any deprecation warnings during build
- Test all routes and API endpoints

### React 19.2.1

React 19.2.1 should be compatible with 19.1.0, but:

- Review any React 19 migration notes if you upgraded from 18
- Check for any new warnings in the console
- Verify all hooks and components work correctly

## Verification

After deployment, verify:

1. Application builds successfully
2. All pages load correctly
3. API routes work
4. No console errors
5. TypeScript types are correct

## Rollback Plan

If issues occur:

```bash
# Revert package.json
git checkout HEAD~1 web/package.json

# Reinstall
cd web
npm install

# Rebuild
npm run build
```
