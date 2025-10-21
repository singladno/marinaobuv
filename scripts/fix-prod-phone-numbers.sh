#!/bin/bash

# Production script to fix WhatsApp phone numbers on the server
# This script will run the migration on the production database

echo "🚀 Starting production phone number migration..."
echo "=============================================="

# Navigate to the web directory
cd /var/www/marinaobuv/web

# Create a simple migration script that can run on production
cat > scripts/fix-prod-phone-numbers.ts << 'EOF'
#!/usr/bin/env tsx

/**
 * Production migration script to fix WhatsApp phone numbers
 * This version is designed to run on the production server
 */

import { PrismaClient } from '@prisma/client';

// Copy the functions directly to avoid server-only imports
function normalizePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('7')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('0')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length === 10) return `+7${digits}`;
  if (digits.startsWith('89') && digits.length === 11)
    return `+7${digits.slice(1)}`;
  return `+${digits}`;
}

function extractPhoneFromWhatsAppId(whatsappId: string | null): string | null {
  if (!whatsappId) return null;
  
  // Remove @c.us suffix and any other WhatsApp-specific suffixes
  const cleanId = whatsappId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
  
  // If it's already a clean phone number, normalize it
  if (/^\d+$/.test(cleanId)) {
    return normalizePhoneToE164(cleanId);
  }
  
  return null;
}

function isWhatsAppId(value: string): boolean {
  return /^\d+@[cg]\.us$/.test(value);
}

function extractNormalizedPhone(phoneOrId: string | null): string | null {
  if (!phoneOrId) return null;
  
  if (isWhatsAppId(phoneOrId)) {
    return extractPhoneFromWhatsAppId(phoneOrId);
  }
  
  // Only normalize if it looks like a valid phone number
  if (/^\d+$/.test(phoneOrId) || phoneOrId.startsWith('+')) {
    return normalizePhoneToE164(phoneOrId);
  }
  
  return null;
}

async function fixProviderPhoneNumbers() {
  console.log('🔧 Starting provider phone number migration...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all providers with phone numbers
    const providers = await prisma.provider.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true, name: true },
    });
    
    console.log(`📊 Found ${providers.length} providers with phone numbers`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const provider of providers) {
      if (!provider.phone) continue;
      
      try {
        // Extract normalized phone from WhatsApp ID or regular phone
        const normalizedPhone = extractNormalizedPhone(provider.phone);
        
        if (normalizedPhone && normalizedPhone !== provider.phone) {
          console.log(`🔄 Updating provider ${provider.name} (${provider.id}):`);
          console.log(`   From: ${provider.phone}`);
          console.log(`   To:   ${normalizedPhone}`);
          
          await prisma.provider.update({
            where: { id: provider.id },
            data: { phone: normalizedPhone },
          });
          
          updated++;
        } else {
          console.log(`✅ Provider ${provider.name} already has normalized phone: ${provider.phone}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error updating provider ${provider.name}:`, error);
        errors++;
      }
    }
    
    console.log('\n📈 Provider Migration Summary:');
    console.log(`   ✅ Updated: ${updated} providers`);
    console.log(`   ⏭️  Skipped: ${skipped} providers`);
    console.log(`   ❌ Errors: ${errors} providers`);
    
  } catch (error) {
    console.error('❌ Provider migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixWhatsAppMessageFromFields() {
  console.log('\n🔧 Starting WhatsApp message "from" field migration...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all WhatsApp messages with "from" field that looks like WhatsApp ID
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        from: { not: null },
        // Look for WhatsApp ID pattern
        from: { contains: '@c.us' },
      },
      select: { id: true, from: true, fromName: true },
    });
    
    console.log(`📊 Found ${messages.length} messages with WhatsApp ID format`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const message of messages) {
      if (!message.from) continue;
      
      try {
        // Extract normalized phone from WhatsApp ID
        const normalizedPhone = extractNormalizedPhone(message.from);
        
        if (normalizedPhone && normalizedPhone !== message.from) {
          console.log(`🔄 Updating message ${message.id}:`);
          console.log(`   From: ${message.from}`);
          console.log(`   To:   ${normalizedPhone}`);
          
          await prisma.whatsAppMessage.update({
            where: { id: message.id },
            data: { from: normalizedPhone },
          });
          
          updated++;
        } else {
          console.log(`✅ Message ${message.id} already has normalized phone: ${message.from}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error updating message ${message.id}:`, error);
        errors++;
      }
    }
    
    console.log('\n📈 Message Migration Summary:');
    console.log(`   ✅ Updated: ${updated} messages`);
    console.log(`   ⏭️  Skipped: ${skipped} messages`);
    console.log(`   ❌ Errors: ${errors} messages`);
    
  } catch (error) {
    console.error('❌ Message migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Production WhatsApp Phone Number Migration Script');
  console.log('====================================================\n');
  
  await fixProviderPhoneNumbers();
  await fixWhatsAppMessageFromFields();
  
  console.log('\n🎉 Production migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test provider login with normalized phone numbers');
  console.log('2. Verify that new WhatsApp messages are processed correctly');
  console.log('3. Monitor the system for any issues');
}

main().catch(console.error);
EOF

# Make the script executable
chmod +x scripts/fix-prod-phone-numbers.ts

# Run the migration script
echo "📦 Running production phone number migration..."
npx tsx scripts/fix-prod-phone-numbers.ts

# Clean up the temporary script
rm scripts/fix-prod-phone-numbers.ts

echo "✅ Production migration completed!"
