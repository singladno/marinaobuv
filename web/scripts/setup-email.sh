#!/bin/bash

# Email Setup Script for MarinaObuv Production
# This script helps configure email settings for production

echo "🚀 MarinaObuv Email Setup for Production"
echo "========================================"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please create it first by copying from env.example"
    exit 1
fi

echo "📧 Email Configuration Options for Russia:"
echo ""
echo "1. Yandex Mail (Recommended for Russia)"
echo "   - Best deliverability to Russian email providers"
echo "   - No blocking by Russian ISPs"
echo "   - Free with generous limits"
echo ""
echo "2. Mail.ru (Alternative Russian provider)"
echo "   - Good for Russian market"
echo "   - Similar to Yandex Mail"
echo ""
echo "3. Gmail (International)"
echo "   - Good for international users"
echo "   - May have deliverability issues in Russia"
echo ""

read -p "Choose email provider (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Setting up Yandex Mail..."
        echo ""
        echo "Steps to configure:"
        echo "1. Go to https://mail.yandex.ru/"
        echo "2. Create account: noreply@marinaobuv.ru (or use existing)"
        echo "3. Enable SMTP access in settings"
        echo "4. Create app password if 2FA is enabled"
        echo ""
        read -p "Enter your Yandex email: " yandex_email
        read -s -p "Enter your Yandex password/app password: " yandex_password
        echo ""
        
        # Update .env.production
        sed -i.bak "s/SMTP_USER=.*/SMTP_USER=$yandex_email/" .env.production
        sed -i.bak "s/SMTP_PASS=.*/SMTP_PASS=$yandex_password/" .env.production
        sed -i.bak "s/SMTP_FROM=.*/SMTP_FROM=$yandex_email/" .env.production
        
        echo "✅ Yandex Mail configuration updated!"
        ;;
    2)
        echo ""
        echo "🔧 Setting up Mail.ru..."
        echo ""
        read -p "Enter your Mail.ru email: " mailru_email
        read -s -p "Enter your Mail.ru password: " mailru_password
        echo ""
        
        # Update .env.production
        sed -i.bak "s/SMTP_HOST=.*/SMTP_HOST=smtp.mail.ru/" .env.production
        sed -i.bak "s/SMTP_USER=.*/SMTP_USER=$mailru_email/" .env.production
        sed -i.bak "s/SMTP_PASS=.*/SMTP_PASS=$mailru_password/" .env.production
        sed -i.bak "s/SMTP_FROM=.*/SMTP_FROM=$mailru_email/" .env.production
        
        echo "✅ Mail.ru configuration updated!"
        ;;
    3)
        echo ""
        echo "🔧 Setting up Gmail..."
        echo ""
        echo "Note: Gmail requires app password, not regular password"
        echo "1. Enable 2FA on Gmail"
        echo "2. Generate app password for 'Mail'"
        echo ""
        read -p "Enter your Gmail address: " gmail_email
        read -s -p "Enter your Gmail app password: " gmail_password
        echo ""
        
        # Update .env.production
        sed -i.bak "s/SMTP_HOST=.*/SMTP_HOST=smtp.gmail.com/" .env.production
        sed -i.bak "s/SMTP_USER=.*/SMTP_USER=$gmail_email/" .env.production
        sed -i.bak "s/SMTP_PASS=.*/SMTP_PASS=$gmail_password/" .env.production
        sed -i.bak "s/SMTP_FROM=.*/SMTP_FROM=$gmail_email/" .env.production
        
        echo "✅ Gmail configuration updated!"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🧪 Testing email configuration..."
echo ""

# Test email functionality
echo "Testing email service..."
if curl -s -X POST https://marina-obuv.ru/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "password-reset"}' > /dev/null; then
    echo "✅ Email test endpoint is accessible"
else
    echo "⚠️  Email test endpoint not accessible (server may not be running)"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Deploy your application with the new email configuration"
echo "2. Test password recovery functionality"
echo "3. Test user registration emails"
echo "4. Test order confirmation emails"
echo ""
echo "🔍 To test manually:"
echo "curl -X POST https://marina-obuv.ru/api/test-email \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"your-email@example.com\", \"type\": \"password-reset\"}'"
echo ""
echo "✅ Email setup complete!"
