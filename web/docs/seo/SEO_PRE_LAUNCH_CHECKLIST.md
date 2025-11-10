# SEO Pre-Launch Checklist: Verify Everything Before Going Live

## 🎯 Goal

Verify your new server app is **perfectly configured for SEO** BEFORE switching DNS.

You can test everything by IP address - no Search Console needed!

---

## ✅ Complete SEO Verification Checklist

### 1. Basic SEO Elements

#### 1.1 Metadata (Title, Description)

**Test:** Visit pages and check HTML source

**What to verify:**
- [ ] Every page has `<title>` tag
- [ ] Every page has `<meta name="description">` tag
- [ ] Titles are unique (not duplicated)
- [ ] Descriptions are 120-160 characters
- [ ] Titles include relevant keywords
- [ ] Descriptions are compelling

**How to test:**
```bash
# Visit page and view source
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "<title>"
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "meta name=\"description\""
```

**Expected:**
```html
<title>Женская обувь — MarinaObuv</title>
<meta name="description" content="Купить женскую обувь оптом можно в интернет-магазине МаринаОбувь. Широкий выбор женской и мужской обуви.">
```

---

#### 1.2 OpenGraph Tags (Social Sharing)

**Test:** Check for OpenGraph meta tags

**What to verify:**
- [ ] `og:title` present
- [ ] `og:description` present
- [ ] `og:image` present (1200x630px recommended)
- [ ] `og:url` present (canonical URL)
- [ ] `og:type` present (website/product)

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "og:"
```

**Expected:**
```html
<meta property="og:title" content="Женская обувь — MarinaObuv">
<meta property="og:description" content="...">
<meta property="og:image" content="https://marinaobuv.ru/image.jpg">
<meta property="og:url" content="https://marinaobuv.ru/catalog/zhenskaya_obuv">
```

---

#### 1.3 Twitter Card Tags

**Test:** Check for Twitter Card meta tags

**What to verify:**
- [ ] `twitter:card` present (should be "summary_large_image")
- [ ] `twitter:title` present
- [ ] `twitter:description` present
- [ ] `twitter:image` present

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "twitter:"
```

---

#### 1.4 Canonical URLs

**Test:** Check canonical tags

**What to verify:**
- [ ] Every page has `<link rel="canonical">` tag
- [ ] Canonical URLs use `https://marinaobuv.ru` (not IP or old domain)
- [ ] Canonical URLs are absolute (full URL, not relative)
- [ ] No duplicate canonical URLs

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "canonical"
```

**Expected:**
```html
<link rel="canonical" href="https://marinaobuv.ru/catalog/zhenskaya_obuv">
```

**⚠️ Important:** Even though you're testing by IP, canonical URLs should point to the final domain (`marinaobuv.ru`).

---

### 2. Structured Data (JSON-LD)

#### 2.1 Check for Structured Data

**Test:** Verify JSON-LD scripts are present

**What to verify:**
- [ ] Homepage has Organization schema
- [ ] Product pages have Product schema
- [ ] Category pages have BreadcrumbList schema
- [ ] All structured data is valid JSON

**How to test:**
```bash
# Check for JSON-LD
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "application/ld+json"

# Or use browser dev tools:
# 1. Open page
# 2. View source
# 3. Search for "application/ld+json"
```

**Expected:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  ...
}
</script>
```

---

#### 2.2 Validate Structured Data

**Test:** Use online validators

**Tools:**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

**What to verify:**
- [ ] No errors in structured data
- [ ] All required fields present
- [ ] Valid JSON syntax
- [ ] Correct schema types

**How to test:**
1. Copy HTML from your page (by IP)
2. Paste into validator
3. Check for errors

---

### 3. Technical SEO

#### 3.1 Robots.txt

**Test:** Check robots.txt file

**What to verify:**
- [ ] File exists: `http://YOUR_NEW_SERVER_IP/robots.txt`
- [ ] Allows search engines (not blocking)
- [ ] References sitemap location
- [ ] Correct format

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/robots.txt
```

**Expected:**
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://marinaobuv.ru/sitemap.xml
```

---

#### 3.2 Sitemap

**Test:** Check sitemap file

**What to verify:**
- [ ] File exists: `http://YOUR_NEW_SERVER_IP/sitemap.xml`
- [ ] Valid XML format
- [ ] Contains all important pages
- [ ] URLs use `https://marinaobuv.ru` (not IP)
- [ ] No broken URLs in sitemap
- [ ] Includes lastModified dates
- [ ] Includes priorities and changeFrequency

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/sitemap.xml
```

**Expected:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://marinaobuv.ru/</loc>
    <lastmod>2025-01-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  ...
</urlset>
```

**⚠️ Important:** Sitemap URLs should use final domain (`marinaobuv.ru`), not IP address.

---

#### 3.3 URL Structure

**Test:** Compare with old website

**What to verify:**
- [ ] URL paths match old website exactly
- [ ] No unnecessary redirects
- [ ] Clean URLs (no query parameters in paths)
- [ ] Consistent URL format

**How to test:**
1. List all URLs from old website
2. Test each URL on new server (by IP)
3. Verify they work (200 OK, not 404)

**Example:**
```bash
# Old website URL
https://marinaobuv.ru/catalog/zhenskaya_obuv

# Test on new server
curl -I http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv
# Should return: HTTP/1.1 200 OK
```

---

#### 3.4 HTTPS/SSL

**Test:** Verify SSL configuration (after DNS switch)

**What to verify:**
- [ ] HTTPS works: `https://marinaobuv.ru`
- [ ] Valid SSL certificate
- [ ] No mixed content warnings
- [ ] HTTP redirects to HTTPS

**How to test:**
```bash
curl -I https://marinaobuv.ru
# Should return: HTTP/2 200
```

---

### 4. Content SEO

#### 4.1 Heading Structure

**Test:** Check H1, H2, H3 tags

**What to verify:**
- [ ] Every page has exactly one H1 tag
- [ ] H1 contains main keyword
- [ ] Logical heading hierarchy (H1 → H2 → H3)
- [ ] Headings are descriptive

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "<h1>"
```

---

#### 4.2 Image Alt Tags

**Test:** Check image alt attributes

**What to verify:**
- [ ] All images have `alt` attributes
- [ ] Alt text is descriptive
- [ ] Alt text includes keywords (where relevant)
- [ ] No empty alt tags (unless decorative images)

**How to test:**
```bash
curl http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv | grep -i "<img" | grep -i "alt="
```

---

#### 4.3 Internal Linking

**Test:** Check internal links

**What to verify:**
- [ ] Links use correct URLs (final domain)
- [ ] No broken internal links
- [ ] Logical link structure
- [ ] Important pages are linked

---

### 5. Performance (Affects SEO)

#### 5.1 Page Load Speed

**Test:** Measure page load time

**What to verify:**
- [ ] Pages load quickly (< 3 seconds)
- [ ] No blocking resources
- [ ] Images optimized
- [ ] CSS/JS minified

**Tools:**
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- Browser DevTools Network tab

---

#### 5.2 Mobile Responsiveness

**Test:** Check mobile view

**What to verify:**
- [ ] Site is mobile-friendly
- [ ] Responsive design works
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough

**Tools:**
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- Browser DevTools device emulation

---

### 6. URL Compatibility Check

#### 6.1 Test All Indexed URLs

**Test:** Verify all old URLs work on new server

**What to verify:**
- [ ] All indexed URLs return 200 OK (not 404)
- [ ] URLs match exactly
- [ ] Content is correct

**How to test:**
1. Export indexed URLs from Google Search Console
2. Test each URL on new server (by IP)
3. Verify no 404 errors

**Script:**
```bash
# Test single URL
curl -I http://YOUR_NEW_SERVER_IP/catalog/zhenskaya_obuv

# Should return: HTTP/1.1 200 OK
# NOT: HTTP/1.1 404 Not Found
```

---

## 🛠️ Automated Testing Script

I'll create a script to automate most of these checks (see next section).

---

## 📋 Quick Pre-Launch Checklist

**Before switching DNS, verify:**

### Essential (Must Have):
- [ ] All indexed URLs work (no 404s)
- [ ] URL structure matches old website
- [ ] Sitemap is valid and accessible
- [ ] Robots.txt is correct
- [ ] Canonical URLs point to final domain
- [ ] All pages have title and description
- [ ] Structured data is valid

### Important (Should Have):
- [ ] OpenGraph tags present
- [ ] Twitter Card tags present
- [ ] Images have alt tags
- [ ] H1 tags on all pages
- [ ] Mobile-friendly
- [ ] Fast page load

### Nice to Have:
- [ ] Rich snippets configured
- [ ] Breadcrumbs structured data
- [ ] Product structured data
- [ ] Organization structured data

---

## ✅ Final Verification

**Before going live, run this final check:**

1. **Test by IP:** `http://YOUR_NEW_SERVER_IP`
2. **Check sitemap:** `http://YOUR_NEW_SERVER_IP/sitemap.xml`
3. **Check robots.txt:** `http://YOUR_NEW_SERVER_IP/robots.txt`
4. **Test key pages:** Homepage, catalog, product pages
5. **Verify URLs:** All indexed URLs work
6. **Check metadata:** Title, description, OpenGraph
7. **Validate structured data:** Use online validators

**If everything passes → You're ready to switch DNS!**

---

**Last Updated**: 2025-01-07

