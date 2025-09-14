#!/usr/bin/env tsx

// Load environment variables from .env.local BEFORE any other imports
import './load-env';

import { env } from '../lib/env';

/**
 * Fetch all groups from WHAPI
 */
async function fetchGroups() {
  try {
    console.log('Fetching groups from WHAPI...\n');

    // Try different possible endpoints for groups
    const endpoints = [
      '/groups',
      '/chats',
      '/groups/list',
      '/chats/list',
      '/groups/get',
      '/chats/get'
    ];

    let groups = [];
    let successfulEndpoint = '';

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(`${env.WHAPI_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success with ${endpoint}:`, JSON.stringify(data, null, 2));

          // Handle different response formats
          if (Array.isArray(data)) {
            groups = data;
          } else if (data.data && Array.isArray(data.data)) {
            groups = data.data;
          } else if (data.groups && Array.isArray(data.groups)) {
            groups = data.groups;
          } else if (data.chats && Array.isArray(data.chats)) {
            groups = data.chats;
          }

          if (groups.length > 0) {
            successfulEndpoint = endpoint;
            break;
          }
        } else {
          console.log(`❌ Failed with ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error.message);
      }
    }

    if (groups.length === 0) {
      console.log('No groups found with any endpoint');
      return;
    }

    console.log(`\n✅ Found ${groups.length} groups using endpoint: ${successfulEndpoint}\n`);

    groups.forEach((group, index) => {
      console.log(`--- Group ${index + 1} ---`);
      console.log(`ID: ${group.id || group.jid || group.chat_id || 'N/A'}`);
      console.log(`Name: ${group.name || group.subject || 'N/A'}`);
      console.log(`Description: ${group.description || 'N/A'}`);
      console.log(`Participants: ${group.participants?.length || group.participants_count || 'N/A'}`);
      console.log(`Created: ${group.created_at || group.creation || 'N/A'}`);
      console.log('');
    });

    // Look for "Распродажа Садовода" specifically
    const targetGroup = groups.find(group => {
      const name = group.name || group.subject || '';
      return name.toLowerCase().includes('распродажа') ||
             name.toLowerCase().includes('садовода') ||
             name.toLowerCase().includes('распродажа садовода');
    });

    if (targetGroup) {
      console.log('🎯 FOUND TARGET GROUP:');
      console.log(`ID: ${targetGroup.id || targetGroup.jid || targetGroup.chat_id}`);
      console.log(`Name: ${targetGroup.name || targetGroup.subject}`);
      console.log(`Description: ${targetGroup.description || 'N/A'}`);
    } else {
      console.log('❌ Target group "Распродажа Садовода" not found');
      console.log('Available group names:');
      groups.forEach(group => {
        console.log(`- ${group.name || group.subject || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('Error fetching groups:', error);
  }
}

fetchGroups();
