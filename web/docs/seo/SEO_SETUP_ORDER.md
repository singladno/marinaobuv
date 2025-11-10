# SEO Setup Order: When to Configure Search Consoles

## 🎯 Your Question

Should you:
1. Set up Google Search Console & Yandex Webmaster on `marina-obuv.ru` (for testing)?
2. Then migrate DNS for `marinaobuv.ru` to point to new server?

---

## ✅ Recommended Approach

### Option 1: Set Up on Final Domain (RECOMMENDED)

**Best practice:** Set up SEO tools on the domain that will actually be live (`marinaobuv.ru`).

**Why:**
- ✅ No need to migrate/reconfigure later
- ✅ Clean setup from the start
- ✅ No confusion about which domain is "real"
- ✅ Historical data starts accumulating immediately

**Process:**
1. **Set up new server** (test by IP first)
2. **Verify everything works** (URLs, sitemap, etc.)
3. **Switch DNS** for `marinaobuv.ru` to new server
4. **Set up Google Search Console** for `marinaobuv.ru`
5. **Set up Yandex Webmaster** for `marinaobuv.ru`
6. **Submit sitemaps** and verify

---

### Option 2: Test on marina-obuv.ru First (OPTIONAL)

**If you want to test SEO setup first:**

You can set up on `marina-obuv.ru` for testing, but it's **not necessary** if you're confident in your setup.

**Process:**
1. **Set up new server** (test by IP)
2. **Point `marina-obuv.ru` DNS** to new server (temporarily)
3. **Set up Google Search Console** for `marina-obuv.ru` (test)
4. **Set up Yandex Webmaster** for `marina-obuv.ru` (test)
5. **Test SEO setup** (sitemap, URLs, etc.)
6. **Switch `marinaobuv.ru` DNS** to new server
7. **Set up Google Search Console** for `marinaobuv.ru` (real)
8. **Set up Yandex Webmaster** for `marinaobuv.ru` (real)

**Pros:**
- ✅ Can test SEO setup before going live
- ✅ Verify everything works

**Cons:**
- ⚠️ Extra setup work (two domains)
- ⚠️ Need to configure twice
- ⚠️ Can be confusing

---

## 🎯 My Recommendation

**Skip the test domain setup** - Go straight to `marinaobuv.ru`:

### Simplified Process:

1. **Test new server by IP** (verify everything works)
2. **Verify URLs match** (compare with indexed URLs)
3. **Switch DNS** for `marinaobuv.ru` to new server
4. **Set up Google Search Console** for `marinaobuv.ru`
5. **Set up Yandex Webmaster** for `marinaobuv.ru`
6. **Submit sitemaps** and monitor

**Why skip testing on `marina-obuv.ru`?**
- You can test everything by IP first
- No need for a separate test domain
- Cleaner, simpler process
- Less chance of confusion

---

## 📋 Detailed Step-by-Step (Recommended)

### Phase 1: Pre-DNS Switch Testing

**Test new server WITHOUT Search Console setup:**

1. **Deploy new server**
2. **Access by IP:** `http://YOUR_NEW_SERVER_IP`
3. **Test everything:**
   - [ ] Homepage works
   - [ ] Catalog pages work
   - [ ] Product pages work
   - [ ] Sitemap accessible: `http://YOUR_NEW_SERVER_IP/sitemap.xml`
   - [ ] Robots.txt accessible: `http://YOUR_NEW_SERVER_IP/robots.txt`
   - [ ] All indexed URLs work (no 404s)

4. **Verify URL structure:**
   - [ ] Compare with old website URLs
   - [ ] URLs match exactly (or redirects configured)
   - [ ] Sitemap URLs match old sitemap

**At this point:** You've verified everything works, but haven't set up Search Consoles yet.

---

### Phase 2: DNS Switch

**Switch DNS for `marinaobuv.ru`:**

1. **Update DNS A record** for `marinaobuv.ru`
2. **Wait for propagation** (15 min - 48 hours)
3. **Verify site loads:** `https://marinaobuv.ru`

**At this point:** Site is live on `marinaobuv.ru`, but Search Consoles not set up yet.

---

### Phase 3: Set Up Search Consoles (AFTER DNS Switch)

**Now set up SEO tools on the live domain:**

#### Google Search Console:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `marinaobuv.ru`
3. Verify ownership (HTML file, meta tag, or DNS)
4. Submit sitemap: `https://marinaobuv.ru/sitemap.xml`
5. Use "URL Inspection" to test key pages
6. Request indexing for important pages

#### Yandex Webmaster:
1. Go to [Yandex Webmaster](https://webmaster.yandex.ru/)
2. Add site: `marinaobuv.ru`
3. Verify ownership (HTML file, meta tag, or DNS)
4. Submit sitemap: `https://marinaobuv.ru/sitemap.xml`
5. Configure region: Russia
6. Use "Re-indexing" tool for key pages

**At this point:** SEO tools are set up and monitoring the live site.

---

## 🤔 Should You Test on marina-obuv.ru First?

### When to Test on marina-obuv.ru:

**Test if:**
- ❓ You're unsure about your SEO setup
- ❓ You want to verify sitemap generation works
- ❓ You want to test Search Console features
- ❓ You have time for extra setup

**Skip if:**
- ✅ You're confident in your setup
- ✅ You've tested everything by IP
- ✅ You want a simpler process
- ✅ You want to go live faster

---

## 💡 Best Practice

**Recommended order:**

1. **Test by IP** (no Search Console needed)
   - Verify all URLs work
   - Verify sitemap is correct
   - Verify no 404 errors

2. **Switch DNS** (make site live)

3. **Set up Search Consoles** (on live domain)
   - Google Search Console for `marinaobuv.ru`
   - Yandex Webmaster for `marinaobuv.ru`

4. **Monitor and optimize**

**Why this order?**
- ✅ Simpler (one domain setup)
- ✅ Cleaner (no test domain confusion)
- ✅ Faster (no extra steps)
- ✅ Standard practice

---

## 🚨 Important Notes

### About marina-obuv.ru:

**If you're not using `marina-obuv.ru`:**
- ❌ Don't set up Search Console for it
- ❌ Don't waste time on it
- ✅ Focus on `marinaobuv.ru` (the real domain)

**If you want to use `marina-obuv.ru` for testing:**
- ⚠️ It's optional
- ⚠️ Adds extra work
- ⚠️ Not necessary if you test by IP

---

## ✅ Final Recommendation

**My advice:**

1. **Skip `marina-obuv.ru` setup** - Not necessary
2. **Test new server by IP** - Verify everything works
3. **Switch DNS for `marinaobuv.ru`** - Make it live
4. **Set up Search Consoles for `marinaobuv.ru`** - On the live domain

**This is:**
- ✅ Simpler
- ✅ Cleaner
- ✅ Faster
- ✅ Standard practice

---

## 📋 Quick Checklist

**Before DNS Switch:**
- [ ] Test new server by IP
- [ ] Verify all URLs work (no 404s)
- [ ] Verify URL structure matches
- [ ] Verify sitemap is correct
- [ ] **Don't set up Search Consoles yet**

**After DNS Switch:**
- [ ] Verify site loads on `marinaobuv.ru`
- [ ] Set up Google Search Console for `marinaobuv.ru`
- [ ] Set up Yandex Webmaster for `marinaobuv.ru`
- [ ] Submit sitemaps
- [ ] Monitor for errors

---

## 🎯 Summary

**Your question:** Should I configure Search Consoles on `marina-obuv.ru` for testing first?

**Answer:** **No, not necessary!**

**Better approach:**
1. Test new server by IP (no Search Console needed)
2. Switch DNS for `marinaobuv.ru`
3. Set up Search Consoles on `marinaobuv.ru` (the live domain)

**This is simpler, cleaner, and faster!**

---

**Last Updated**: 2025-01-07

