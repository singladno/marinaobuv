# ✅ DNS Switch Checklist: Step-by-Step Plan

## 🎯 Your Understanding (Correct!)

You've got the right idea! Here's the complete, verified plan:

---

## 📋 Complete Step-by-Step Plan

### Phase 1: Gather Information (BEFORE DNS Switch)

#### Step 1.1: Export Indexed URLs from Search Consoles

**Google Search Console:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: `marinaobuv.ru` (or current domain)
3. Go to **Pages** → See all indexed pages
4. **Export the list** of all indexed URLs
   - Save as: `google-indexed-urls.txt` or `.csv`

**Yandex Webmaster:**
1. Go to [Yandex Webmaster](https://webmaster.yandex.ru/)
2. Select site: `marinaobuv.ru` (or current domain)
3. Go to **Indexing** → **Pages**
4. **Export the list** of all indexed URLs
   - Save as: `yandex-indexed-urls.txt` or `.csv`

**Result:** You now have a complete list of all URLs that Google and Yandex have indexed.

---

#### Step 1.2: Get Current Sitemaps

**From Old Website:**
1. Visit: `https://marinaobuv.ru/sitemap.xml` (or current domain)
2. Download/save the sitemap
3. Note the URL structure and format

**From Search Consoles:**
- Google Search Console → Sitemaps → See submitted sitemap
- Yandex Webmaster → Indexing → Sitemap files → See submitted sitemap

---

#### Step 1.3: Test New Server (Before DNS Switch)

**Important:** Test your new server BEFORE switching DNS!

1. **Access new server directly:**
   - By IP: `http://YOUR_NEW_SERVER_IP`
   - Or test domain: `http://test.marinaobuv.ru` (if configured)

2. **Verify new server works:**
   - Homepage loads correctly
   - Catalog pages work
   - Product pages work
   - Sitemap accessible: `http://YOUR_NEW_SERVER_IP/sitemap.xml`

---

### Phase 2: Compare and Verify (BEFORE DNS Switch)

#### Step 2.1: Compare URL Structures

**Compare indexed URLs with new app URLs:**

1. **List all indexed URLs** (from Step 1.1)
   ```
   /catalog/zhenskaya_obuv
   /catalog/muzhskaya_obuv
   /product/shoe-123
   ```

2. **Check what URLs your new app generates:**
   - Test on new server
   - Check sitemap: `http://YOUR_NEW_SERVER_IP/sitemap.xml`
   - Verify URL format matches

3. **Identify mismatches:**
   - Old: `/catalog/zhenskaya_obuv`
   - New: `/catalog/womens` ❌ MISMATCH!

---

#### Step 2.2: Verify All Indexed URLs Work

**Test each indexed URL on new server:**

1. **Manual testing:**
   - Visit: `http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv`
   - Should return: **200 OK** (not 404!)
   - Repeat for all important URLs

2. **Automated testing (recommended):**
   - Create script to test all URLs
   - Or use tools like Screaming Frog SEO Spider
   - Verify no 404 errors

**Critical:** If ANY indexed URL returns 404, **DO NOT SWITCH DNS!**

---

#### Step 2.3: Compare Sitemaps

**Compare old sitemap vs new sitemap:**

1. **Old sitemap URLs:**
   ```
   https://marinaobuv.ru/catalog/zhenskaya_obuv
   https://marinaobuv.ru/catalog/muzhskaya_obuv
   ```

2. **New sitemap URLs (from new server):**
   ```
   http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv
   http://YOUR_NEW_SERVER_IP/catalog/muzhskaya_obuv
   ```

3. **Verify:**
   - ✅ URL paths match exactly (same structure)
   - ✅ Same number of URLs (or more)
   - ✅ No missing important pages

---

### Phase 3: Fix Issues (BEFORE DNS Switch)

#### Step 3.1: Fix URL Mismatches

**If URLs don't match:**

**Option A: Update new app to match old URLs (BEST)**
- Change routing to use same URL structure
- Example: Use `/catalog/zhenskaya_obuv` instead of `/catalog/womens`

**Option B: Create redirects (ACCEPTABLE)**
- Set up 301 redirects from old URLs to new URLs
- Example: `/catalog/zhenskaya_obuv` → `/catalog/womens`

**Don't proceed until URLs match or redirects are configured!**

---

#### Step 3.2: Fix 404 Errors

**If any indexed URL returns 404:**

1. **Identify the issue:**
   - Which URLs return 404?
   - Why? (wrong path, missing page, etc.)

2. **Fix the issue:**
   - Create missing pages
   - Fix routing
   - Add redirects

3. **Re-test:**
   - Verify all URLs work
   - No 404 errors

**Don't proceed until all indexed URLs work!**

---

### Phase 4: Final Verification (BEFORE DNS Switch)

#### Step 4.1: Complete Checklist

Before switching DNS, verify:

- [ ] **All indexed URLs work on new server** (no 404s)
- [ ] **URL structure matches exactly** (or redirects configured)
- [ ] **Sitemap is correct** (same URLs, correct format)
- [ ] **New server is fully functional** (all features work)
- [ ] **Environment variables updated** (`NEXT_PUBLIC_SITE_URL=https://marinaobuv.ru`)
- [ ] **Nginx configured** (serves app on `marinaobuv.ru`)
- [ ] **SSL certificates ready** (for HTTPS)
- [ ] **Both Search Consoles ready** (Google + Yandex properties added)

---

#### Step 4.2: Test New Server One More Time

**Final test before DNS switch:**

1. **Test all critical URLs:**
   ```
   http://YOUR_NEW_SERVER_IP/
   http://YOUR_NEW_SERVER_IP/catalog
   http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv
   http://YOUR_NEW_SERVER_IP/sitemap.xml
   http://YOUR_NEW_SERVER_IP/robots.txt
   ```

2. **Verify:**
   - ✅ All return 200 OK
   - ✅ Content loads correctly
   - ✅ No errors in console

---

### Phase 5: DNS Switch (THE MOMENT)

#### Step 5.1: Switch DNS

1. **Go to domain registrar**
2. **Update A record** for `marinaobuv.ru`:
   - Old IP: (current server)
   - New IP: (your new server IP)
3. **Save changes**
4. **Wait for DNS propagation** (15 minutes to 48 hours)

---

#### Step 5.2: Verify DNS Switch

**After DNS propagates:**

1. **Test domain:**
   ```
   https://marinaobuv.ru
   ```

2. **Verify:**
   - ✅ Site loads on new domain
   - ✅ All pages work
   - ✅ No errors

---

### Phase 6: Post-Switch (AFTER DNS Switch)

#### Step 6.1: Update Search Consoles

**Google Search Console:**
1. Add new property: `marinaobuv.ru` (if not already added)
2. Submit sitemap: `https://marinaobuv.ru/sitemap.xml`
3. Use "URL Inspection" to test key pages
4. Request indexing for important pages

**Yandex Webmaster:**
1. Add new site: `marinaobuv.ru` (if not already added)
2. Submit sitemap: `https://marinaobuv.ru/sitemap.xml`
3. Use "Re-indexing" tool for key pages
4. Monitor indexing status

---

#### Step 6.2: Monitor Closely (First 24-48 Hours)

**Check every few hours:**

- [ ] **Google Search Console:**
  - Coverage issues? (should be none)
  - 404 errors? (should be none)
  - Indexing status?

- [ ] **Yandex Webmaster:**
  - Indexing errors? (should be none)
  - 404 errors? (should be none)
  - Search queries?

- [ ] **Manual testing:**
  - Test all indexed URLs manually
  - Verify they all work

---

## ✅ Your Plan Summary (Verified)

You said:
1. ✅ Go to current consoles - generate sitemaps
2. ✅ Compare sitemap with current application server sitemap
3. ✅ Check that all URLs are same for indexed pages
4. ✅ Only after that migrate DNS to point to new website

**Your plan is CORRECT!** Just add these details:

### Additional Steps to Add:

1. **Export indexed URLs** (not just sitemaps - get the actual list of what's indexed)
2. **Test new server BEFORE DNS switch** (by IP or test domain)
3. **Verify all indexed URLs work on new server** (no 404s)
4. **Fix any issues** before switching DNS
5. **Update Search Consoles** after DNS switch

---

## 🎯 Simplified Checklist

**Before DNS Switch:**
- [ ] Export indexed URLs from Google Search Console
- [ ] Export indexed URLs from Yandex Webmaster
- [ ] Get old website sitemap
- [ ] Test new server (by IP)
- [ ] Get new server sitemap
- [ ] Compare URL structures (must match!)
- [ ] Test all indexed URLs on new server (no 404s!)
- [ ] Fix any mismatches or 404 errors
- [ ] Final verification: Everything works

**DNS Switch:**
- [ ] Update DNS A record
- [ ] Wait for propagation
- [ ] Verify site loads on domain

**After DNS Switch:**
- [ ] Update Google Search Console (submit sitemap)
- [ ] Update Yandex Webmaster (submit sitemap)
- [ ] Monitor for errors (first 24-48 hours)
- [ ] Fix any issues immediately

---

## 🚨 Critical Rule

**NEVER switch DNS until:**
- ✅ All indexed URLs work on new server
- ✅ URL structure matches exactly
- ✅ No 404 errors
- ✅ Everything tested and verified

**If you switch DNS with 404 errors, you WILL lose SEO rankings!**

---

## 📝 Quick Reference

**Your plan is correct!** Just remember:

1. **Export indexed URLs** (not just sitemaps)
2. **Test new server BEFORE DNS switch**
3. **Verify URLs match exactly**
4. **Fix all issues first**
5. **Then switch DNS**

---

**Last Updated**: 2025-01-07

