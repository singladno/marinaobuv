# ⚠️ CRITICAL: Preserving SEO URLs During Server Switch

## 🚨 The Problem

Your website is **currently indexed** by Google with URLs like:

- `https://www.marinaobuv.ru/catalog/zhenskaya_obuv`
- Other category/product URLs

**If these URLs don't work on your new server, Google will:**

- See 404 errors
- Remove pages from index
- **You'll lose all your SEO rankings!**

---

## ✅ The Solution: URL Structure Must Match EXACTLY

### Rule #1: Preserve Exact URL Paths

**Old website URLs:**

```
https://www.marinaobuv.ru/catalog/zhenskaya_obuv
https://www.marinaobuv.ru/catalog/muzhskaya_obuv
https://www.marinaobuv.ru/product/some-product-slug
```

**New website URLs MUST be:**

```
https://www.marinaobuv.ru/catalog/zhenskaya_obuv  ✅ SAME
https://www.marinaobuv.ru/catalog/muzhskaya_obuv  ✅ SAME
https://www.marinaobuv.ru/product/some-product-slug  ✅ SAME
```

**If URLs are different:**

```
https://www.marinaobuv.ru/catalog/womens  ❌ DIFFERENT = SEO LOSS
```

---

## 🔍 Step 1: Identify Current URL Structure

### Check Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your `marinaobuv.ru` property
3. Go to **Pages** → See which URLs are indexed
4. **Export the list** of all indexed URLs

### Check Your Old Website

Visit your old website and note:

- Category URL format: `/catalog/zhenskaya_obuv` or `/catalog/womens`?
- Product URL format: `/product/slug` or `/catalog/product/slug`?
- Any other URL patterns

### Check Your New App

Look at your new app's routing:

- What URL structure does it use?
- Does it match the old structure?

---

## 🔧 Step 2: Make URLs Match

### Option A: Update New App to Match Old URLs (Recommended)

If your new app uses different URLs, you need to:

1. **Update routing** to match old structure
2. **Update category paths** to match old format
3. **Update product slugs** to match old format

**Example:**

If old site uses: `/catalog/zhenskaya_obuv`
But new app uses: `/catalog/womens`

**You need to:**

- Either change new app to use `/catalog/zhenskaya_obuv`
- Or create URL mapping/redirects (see Option B)

### Option B: Create URL Redirects (If Structure Must Change)

If you MUST change URL structure, create 301 redirects:

```nginx
# In nginx config
location ~ ^/catalog/zhenskaya_obuv {
    return 301 /catalog/womens$is_args$args;
}

location ~ ^/catalog/muzhskaya_obuv {
    return 301 /catalog/mens$is_args$args;
}
```

**⚠️ Warning:** This will cause temporary SEO loss (2-4 weeks) while Google re-indexes.

---

## 📋 Step 3: Verify URL Compatibility

### Checklist Before Going Live

- [ ] **Category URLs match exactly**
  - Old: `/catalog/zhenskaya_obuv` → New: `/catalog/zhenskaya_obuv` ✅
- [ ] **Product URLs match exactly**
  - Old: `/product/shoe-123` → New: `/product/shoe-123` ✅
- [ ] **All indexed pages work**
  - Test each URL from Google Search Console
  - No 404 errors
- [ ] **Sitemap matches**
  - Old sitemap URLs = New sitemap URLs
- [ ] **Internal links updated**
  - All links point to correct URLs

---

## 🎯 Current Situation Analysis

### Your New App's URL Structure

Based on your code, your new app uses:

- **Catalog pages**: `/catalog/[[...segments]]` (dynamic routing)
- **Category paths**: Uses `buildCategoryPath()` which removes `obuv/` prefix
- **Product pages**: `/product/[slug]`

### Potential Issues

1. **Category Path Format**
   - Old site might use: `/catalog/zhenskaya_obuv`
   - New app might generate: `/catalog/womens` or different format
2. **Path Naming**
   - Old site: Russian names in URLs (`zhenskaya_obuv`)
   - New app: English names (`womens`) or different format

---

## 🔍 Action Items

### 1. Check Old Website URLs

Visit your old website and document:

```
/catalog/zhenskaya_obuv
/catalog/muzhskaya_obuv
/catalog/[other-categories]
/product/[product-slugs]
```

### 2. Check New App URLs

Test your new app and document:

```
/catalog/[what-format?]
/product/[what-format?]
```

### 3. Compare and Fix

**If they match:** ✅ You're good!

**If they don't match:** You need to either:

- Update new app routing to match old URLs
- Create redirects from old URLs to new URLs

---

## 📝 Example: URL Mapping

If old site uses Russian paths but new app uses English:

### Create URL Mapping File

```typescript
// web/src/lib/url-mapping.ts

export const URL_MAPPINGS: Record<string, string> = {
  // Old URL → New URL
  '/catalog/zhenskaya_obuv': '/catalog/womens',
  '/catalog/muzhskaya_obuv': '/catalog/mens',
  '/catalog/detskaya_obuv': '/catalog/kids',
  // ... add all mappings
};

export function getRedirectUrl(oldUrl: string): string | null {
  return URL_MAPPINGS[oldUrl] || null;
}
```

### Use in Middleware

```typescript
// web/middleware.ts
import { URL_MAPPINGS, getRedirectUrl } from '@/lib/url-mapping';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an old URL that needs redirecting
  const redirectUrl = getRedirectUrl(pathname);
  if (redirectUrl) {
    const url = request.nextUrl.clone();
    url.pathname = redirectUrl;
    return NextResponse.redirect(url, 301);
  }

  // ... rest of middleware
}
```

---

## ✅ Best Practice: Match URLs Exactly

**The BEST solution is to make your new app use the EXACT same URLs as the old site.**

This means:

- Same category path format
- Same product slug format
- Same URL structure

**Why?**

- ✅ No redirects needed
- ✅ No SEO loss
- ✅ Instant compatibility
- ✅ No re-indexing delay

---

## 🚨 Critical Checklist Before DNS Switch

Before switching DNS, verify:

- [ ] **All indexed URLs work on new server**
  - Test: `https://your-new-server-ip/catalog/zhenskaya_obuv`
  - Should return 200 OK, not 404
- [ ] **URL structure matches exactly**
  - Compare old URLs vs new URLs
  - They should be identical
- [ ] **Sitemap is correct**
  - Generate sitemap on new server
  - Compare with old sitemap
  - URLs should match
- [ ] **No 404 errors**
  - Test all important URLs
  - Check Google Search Console for indexed URLs
  - All should work
- [ ] **Canonical URLs correct**
  - All pages have correct canonical tags
  - Point to `marinaobuv.ru` (not old domain)

---

## 📊 Monitoring After Switch

### First 24 Hours

- [ ] Check Google Search Console for errors
- [ ] Verify no 404 errors on indexed pages
- [ ] Test all important URLs manually
- [ ] Check sitemap is accessible

### First Week

- [ ] Monitor indexing status
- [ ] Check for crawl errors
- [ ] Verify rankings maintained
- [ ] Fix any issues immediately

---

## 💡 Quick Test Script

Create a script to test all indexed URLs:

```typescript
// scripts/test-indexed-urls.ts

const INDEXED_URLS = [
  '/catalog/zhenskaya_obuv',
  '/catalog/muzhskaya_obuv',
  // ... from Google Search Console
];

async function testUrls() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  for (const url of INDEXED_URLS) {
    const fullUrl = `${baseUrl}${url}`;
    try {
      const response = await fetch(fullUrl);
      if (response.ok) {
        console.log(`✅ ${url}`);
      } else {
        console.error(`❌ ${url} - ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${url} - Error: ${error}`);
    }
  }
}

testUrls();
```

---

## 🎯 Summary

**To preserve SEO:**

1. ✅ **URLs must match EXACTLY** - Same paths, same structure
2. ✅ **Test all indexed URLs** - Make sure they work on new server
3. ✅ **No 404 errors** - All old URLs must work
4. ✅ **Update sitemap** - Ensure it matches old structure
5. ✅ **Monitor closely** - Check for errors after switch

**If URLs don't match, you WILL lose SEO rankings!**

---

## ❓ FAQ

### Q: What if I can't match URLs exactly?

**A:** Create 301 redirects, but expect 2-4 weeks of SEO recovery time.

### Q: Can I change URLs later?

**A:** Yes, but do it gradually and with proper redirects. Better to match now.

### Q: What about product slugs?

**A:** They must match too! If old site has `/product/shoe-123`, new site must have the same.

### Q: How do I know what URLs are indexed?

**A:** Google Search Console → Pages → See all indexed URLs.

---

**Last Updated**: 2025-01-07
