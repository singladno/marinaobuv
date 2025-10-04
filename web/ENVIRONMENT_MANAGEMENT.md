# Environment Management Guide

## 🎯 Simplified Environment Setup

We now use a single `.env` file everywhere for consistency and simplicity.

## 📁 File Structure

```
web/
├── .env                    # Active environment file (used by application)
├── .env.local             # Local development environment (your machine)
├── .env.production        # Production environment (your machine)
└── .env.production.backup # Backup of production environment
```

## 🔄 Environment Management Commands

### **Local Development**

```bash
# Copy local environment to active .env
npm run env:copy:local

# Run parsing locally
npm run parse
```

### **Production Deployment**

```bash
# Copy production environment to active .env
npm run env:copy:prod

# Deploy environment to server
npm run env:deploy

# Run parsing on server
npm run server:parse
```

### **Environment Switching**

```bash
# Switch to local environment
npm run env:copy:local

# Switch to production environment
npm run env:copy:prod

# Deploy current .env to server
npm run env:deploy
```

## 🚀 Deployment Workflow

### **For Local Development:**

1. `npm run env:copy:local` - Use local environment
2. `npm run parse` - Test locally

### **For Production Deployment:**

1. `npm run env:copy:prod` - Switch to production environment
2. `npm run env:deploy` - Deploy to server
3. `npm run server:parse` - Test on server

## 🔧 Environment File Management

### **Local Development (.env.local)**

- Contains your local database credentials
- Has all API keys and secrets for development
- Used for local testing and development

### **Production Environment (.env.production)**

- Contains production database credentials
- Has production API keys and secrets
- Used for server deployment

### **Active Environment (.env)**

- Always the current active environment
- Copied from either `.env.local` or `.env.production`
- Used by the application at runtime

## 📋 Environment Variables Checklist

Make sure your environment files contain:

### **Required for All Environments:**

- `DATABASE_URL` - Database connection string
- `NODE_ENV` - Environment (development/production)
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Authentication URL

### **Required for Parsing:**

- `GREEN_API_INSTANCE_ID` - Green API instance ID
- `GREEN_API_TOKEN` - Green API token
- `GREEN_API_BASE_URL` - Green API base URL
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI base URL

### **Required for File Storage:**

- `S3_ENDPOINT` - S3 endpoint URL
- `S3_BUCKET` - S3 bucket name
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key

## 🛠️ Troubleshooting

### **Environment Not Loading:**

```bash
# Check which .env file is active
ls -la web/.env

# Verify environment variables
npm run parse
```

### **Missing Variables:**

```bash
# Check what's in your environment files
cat web/.env.local | grep VARIABLE_NAME
cat web/.env.production | grep VARIABLE_NAME
```

### **Server Environment Issues:**

```bash
# Check server environment
npm run server:logs

# Deploy fresh environment
npm run env:deploy
```

## 🎯 Best Practices

1. **Always use the commands** to switch environments
2. **Keep .env.local and .env.production** as your source files
3. **Never edit .env directly** - always copy from source files
4. **Test locally first** before deploying to production
5. **Backup your environment files** regularly

## 🔒 Security Notes

- `.env` files contain sensitive information
- Never commit `.env` files to git
- Keep your environment files secure
- Use different credentials for local and production

---

## 🎉 Benefits of This Approach

✅ **Simple**: One `.env` file everywhere  
✅ **Consistent**: Same environment loading logic  
✅ **Safe**: Source files are protected  
✅ **Flexible**: Easy to switch environments  
✅ **Clear**: Obvious which environment is active
