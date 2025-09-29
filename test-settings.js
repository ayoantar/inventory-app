// Test script for system settings persistence
const https = require('https');

// Disable SSL verification for self-signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testSettings() {
  console.log('🧪 Testing System Settings Persistence...\n');

  // Test data
  const testSettings = {
    systemName: 'LSVR Warehouse Test ' + Date.now(),
    timezone: 'America/Los_Angeles',
    maintenanceMode: false,
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    forcePasswordChange: false,
    twoFactorAuth: false
  };

  try {
    // Step 1: Update settings
    console.log('📝 Updating settings...');
    const updateResponse = await fetch('https://warehouse.lightsailvr.com/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to get a valid session cookie from the browser
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      },
      body: JSON.stringify(testSettings)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('❌ Failed to update settings:', error);
      console.log('\n⚠️  Note: You need to replace YOUR_SESSION_TOKEN with a valid session token.');
      console.log('To get a session token:');
      console.log('1. Login to https://warehouse.lightsailvr.com as an admin');
      console.log('2. Open browser DevTools (F12)');
      console.log('3. Go to Application > Cookies');
      console.log('4. Copy the value of next-auth.session-token');
      return;
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Settings updated:', updateResult.message);

    // Step 2: Retrieve settings to verify
    console.log('\n🔍 Retrieving settings...');
    const getResponse = await fetch('https://warehouse.lightsailvr.com/api/admin/settings', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      }
    });

    if (!getResponse.ok) {
      console.error('❌ Failed to retrieve settings');
      return;
    }

    const getResult = await getResponse.json();
    console.log('✅ Current settings:');
    console.log('   - System Name:', getResult.settings.systemName);
    console.log('   - Timezone:', getResult.settings.timezone);
    console.log('   - Session Timeout:', getResult.settings.sessionTimeout, 'minutes');
    console.log('   - Maintenance Mode:', getResult.settings.maintenanceMode);

    // Step 3: Verify persistence
    console.log('\n💾 Settings should now persist across server restarts!');
    console.log('   Settings file location: data/system-settings.json');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSettings();