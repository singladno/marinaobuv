# SEO Documentation

Complete guide for SEO setup, verification, and domain migration for MarinaObuv.

## 📚 Documentation Index

### 1. [SEO Pre-Launch Checklist](./SEO_PRE_LAUNCH_CHECKLIST.md)
**When to use:** Before switching DNS to verify SEO is configured correctly.

Complete checklist to verify all SEO elements are properly configured on your new server before going live. Includes automated testing script.

**Key topics:**
- Metadata verification (title, description, OpenGraph)
- Structured data validation
- Technical SEO (robots.txt, sitemap)
- URL compatibility checks
- Performance and mobile responsiveness

---

### 2. [Preserve SEO URLs](./PRESERVE_SEO_URLS.md)
**When to use:** Critical guide for maintaining SEO during server switch.

Explains why URL structure must match exactly and how to verify all indexed URLs will work on the new server.

**Key topics:**
- Why URLs must match exactly
- How to identify indexed URLs
- URL structure comparison
- Fixing URL mismatches
- Testing indexed URLs

---

### 3. [DNS Switch Checklist](./DNS_SWITCH_CHECKLIST.md)
**When to use:** Step-by-step guide for the actual DNS migration process.

Complete step-by-step plan for switching DNS from old server to new server while preserving SEO.

**Key topics:**
- Pre-migration preparation
- DNS switch process
- Post-migration monitoring
- Search Console setup
- Verification steps

---

### 4. [Yandex vs Google SEO](./YANDEX_VS_GOOGLE_SEO.md)
**When to use:** Understanding which search engines to prioritize for Russian market.

Explains why you need both Google Search Console and Yandex Webmaster, especially for the Russian market.

**Key topics:**
- Market share in Russia
- Why both are needed
- Setup instructions for both
- Priority and monitoring strategy

---

### 5. [SEO Setup Order](./SEO_SETUP_ORDER.md)
**When to use:** Understanding when to set up Search Consoles during migration.

Clarifies whether to set up SEO tools on test domain first or wait until after DNS switch.

**Key topics:**
- When to set up Search Consoles
- Testing vs. production setup
- Recommended order of operations
- Best practices

---

## 🚀 Quick Start

### For First-Time Setup:

1. **Read:** [Preserve SEO URLs](./PRESERVE_SEO_URLS.md) - Understand URL requirements
2. **Read:** [SEO Pre-Launch Checklist](./SEO_PRE_LAUNCH_CHECKLIST.md) - Know what to verify
3. **Follow:** [DNS Switch Checklist](./DNS_SWITCH_CHECKLIST.md) - Execute migration
4. **Set up:** [Yandex vs Google SEO](./YANDEX_VS_GOOGLE_SEO.md) - Configure search consoles

### For DNS Migration:

1. **Before DNS Switch:**
   - [Preserve SEO URLs](./PRESERVE_SEO_URLS.md) - Verify URL compatibility
   - [SEO Pre-Launch Checklist](./SEO_PRE_LAUNCH_CHECKLIST.md) - Run verification

2. **During DNS Switch:**
   - [DNS Switch Checklist](./DNS_SWITCH_CHECKLIST.md) - Follow step-by-step

3. **After DNS Switch:**
   - [Yandex vs Google SEO](./YANDEX_VS_GOOGLE_SEO.md) - Set up search consoles
   - [DNS Switch Checklist](./DNS_SWITCH_CHECKLIST.md) - Post-migration monitoring

---

## 🛠️ Tools & Scripts

### Automated SEO Verification

Run the pre-launch SEO check:

```bash
# Test your new server by IP
TEST_SERVER_URL=http://YOUR_NEW_SERVER_IP npm run seo:pre-launch-check

# With indexed URLs to verify
INDEXED_URLS="/catalog/zhenskaya_obuv,/catalog/muzhskaya_obuv" \
TEST_SERVER_URL=http://YOUR_NEW_SERVER_IP \
npm run seo:pre-launch-check
```

**Location:** `web/scripts/seo-pre-launch-check.ts`

---

## 📋 Critical Rules

### ⚠️ Before DNS Switch:

1. **All indexed URLs must work** on new server (no 404s)
2. **URL structure must match** old website exactly
3. **Sitemap must be correct** and use final domain
4. **Canonical URLs must point** to final domain
5. **All metadata must be present** (title, description, OpenGraph)

### ✅ After DNS Switch:

1. **Set up Google Search Console** for `marinaobuv.ru`
2. **Set up Yandex Webmaster** for `marinaobuv.ru`
3. **Submit sitemaps** to both platforms
4. **Monitor for errors** (first 24-48 hours critical)

---

## 🔗 External Resources

- [Google Search Console](https://search.google.com/search-console)
- [Yandex Webmaster](https://webmaster.yandex.ru/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

---

## 📝 Notes

- All documentation assumes you're migrating from old server to new server
- Domain: `marinaobuv.ru` (final domain)
- Test domain: `marina-obuv.ru` (not used, can be ignored)
- Focus: Russian market (Yandex is critical)

---

**Last Updated**: 2025-01-07


