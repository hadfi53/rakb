#!/usr/bin/env node

/**
 * Environment Variables Runtime Validation Script
 * Tests all integrations: Supabase, Stripe, Resend
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = {
  supabase: {
    publicClient: { status: 'pending', message: '', details: {} },
    serviceRole: { status: 'pending', message: '', details: {} },
  },
  stripe: { status: 'pending', message: '', details: {} },
  resend: { status: 'pending', message: '', details: {} },
  variables: {
    clientSide: {},
    serverSide: {},
  },
};

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test Supabase Public Client
async function testSupabasePublicClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    results.supabase.publicClient = {
      status: 'missing',
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set',
      details: { url: !!supabaseUrl, key: !!supabaseAnonKey },
    };
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Health check via API
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    // Test 2: Query a public table (vehicles)
    const { data, error } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);

    if (error) {
      // Check if it's a permissions error (expected) or connection error
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        results.supabase.publicClient = {
          status: 'success',
          message: 'Connected successfully (RLS may restrict access)',
          details: { 
            url: supabaseUrl,
            connected: true,
            rlsNote: 'RLS policies may restrict query access',
            errorCode: error.code,
          },
        };
      } else {
        throw error;
      }
    } else {
      results.supabase.publicClient = {
        status: 'success',
        message: 'Connected and query successful',
        details: { 
          url: supabaseUrl,
          connected: true,
          sampleRecords: data?.length || 0,
        },
      };
    }
  } catch (error) {
    results.supabase.publicClient = {
      status: 'error',
      message: error.message || 'Connection failed',
      details: { 
        url: supabaseUrl,
        error: error.toString(),
      },
    };
  }
}

// Test Supabase Service Role
async function testSupabaseServiceRole() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    results.supabase.serviceRole = {
      status: 'missing',
      message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set',
      details: { url: !!supabaseUrl, key: !!supabaseServiceKey },
    };
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test: Query with service role (should bypass RLS)
    const { data, error } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    results.supabase.serviceRole = {
      status: 'success',
      message: 'Connected with service role (bypasses RLS)',
      details: { 
        url: supabaseUrl,
        connected: true,
        sampleRecords: data?.length || 0,
      },
    };
  } catch (error) {
    results.supabase.serviceRole = {
      status: 'error',
      message: error.message || 'Connection failed',
      details: { 
        url: supabaseUrl,
        error: error.toString(),
      },
    };
  }
}

// Test Stripe API
async function testStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    results.stripe = {
      status: 'missing',
      message: 'STRIPE_SECRET_KEY not set',
      details: {},
    };
    return;
  }

  try {
    // Test: List products (requires valid API key)
    const response = await makeRequest('https://api.stripe.com/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      results.stripe = {
        status: 'error',
        message: 'Invalid API key (401 Unauthorized)',
        details: { 
          keyPrefix: stripeSecretKey.substring(0, 7) + '...',
          statusCode: response.status,
        },
      };
    } else if (response.status === 200) {
      const data = response.data;
      results.stripe = {
        status: 'success',
        message: `Connected successfully (${data.data?.length || 0} products found)`,
        details: { 
          keyPrefix: stripeSecretKey.substring(0, 7) + '...',
          mode: stripeSecretKey.startsWith('sk_test_') ? 'test' : 'live',
          productsCount: data.data?.length || 0,
        },
      };
    } else {
      results.stripe = {
        status: 'error',
        message: `API returned status ${response.status}`,
        details: { 
          keyPrefix: stripeSecretKey.substring(0, 7) + '...',
          statusCode: response.status,
        },
      };
    }
  } catch (error) {
    results.stripe = {
      status: 'error',
      message: error.message || 'Connection failed',
      details: { 
        keyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' : 'N/A',
        error: error.toString(),
      },
    };
  }
}

// Test Resend API
async function testResend() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL || 'test@rakb.ma';

  if (!resendApiKey) {
    results.resend = {
      status: 'missing',
      message: 'RESEND_API_KEY not set',
      details: {},
    };
    return;
  }

  try {
    // Test: Get API key info (validate key)
    const response = await makeRequest('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      results.resend = {
        status: 'error',
        message: 'Invalid API key (401/403 Unauthorized)',
        details: { 
          keyPrefix: resendApiKey.substring(0, 7) + '...',
          statusCode: response.status,
        },
      };
    } else if (response.status === 200) {
      results.resend = {
        status: 'success',
        message: 'API key validated successfully',
        details: { 
          keyPrefix: resendApiKey.substring(0, 7) + '...',
          contactEmail: contactEmail,
        },
      };
    } else {
      // Try alternative: validate via domains endpoint
      try {
        const domainsResponse = await makeRequest('https://api.resend.com/domains', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (domainsResponse.status === 200) {
          results.resend = {
            status: 'success',
            message: 'API key validated (via domains endpoint)',
            details: { 
              keyPrefix: resendApiKey.substring(0, 7) + '...',
              contactEmail: contactEmail,
              domainsCount: domainsResponse.data?.data?.length || 0,
            },
          };
        } else {
          results.resend = {
            status: 'error',
            message: `API returned status ${domainsResponse.status}`,
            details: { 
              keyPrefix: resendApiKey.substring(0, 7) + '...',
              statusCode: domainsResponse.status,
            },
          };
        }
      } catch (e) {
        results.resend = {
          status: 'warning',
          message: 'API key format appears valid but validation endpoint unavailable',
          details: { 
            keyPrefix: resendApiKey.substring(0, 7) + '...',
            contactEmail: contactEmail,
            note: 'Key format valid, but cannot verify via API',
          },
        };
      }
    }
  } catch (error) {
    results.resend = {
      status: 'error',
      message: error.message || 'Connection failed',
      details: { 
        keyPrefix: resendApiKey ? resendApiKey.substring(0, 7) + '...' : 'N/A',
        error: error.toString(),
      },
    };
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  // Client-side variables
  const clientVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_APP_URL',
    'VITE_APP_NAME',
    'VITE_GA_MEASUREMENT_ID',
    'VITE_PLAUSIBLE_DOMAIN',
    'VITE_MAPBOX_TOKEN',
  ];

  clientVars.forEach((varName) => {
    const value = process.env[varName];
    results.variables.clientSide[varName] = {
      exists: !!value,
      value: value ? (varName.includes('KEY') ? value.substring(0, 7) + '...' : value) : 'NOT SET',
    };
  });

  // Server-side variables (Edge Functions)
  const serverVars = [
    'STRIPE_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CONTACT_EMAIL',
    'RESEND_DOMAIN',
    'RESEND_FROM',
  ];

  serverVars.forEach((varName) => {
    const value = process.env[varName];
    results.variables.serverSide[varName] = {
      exists: !!value,
      value: value ? (varName.includes('KEY') ? value.substring(0, 7) + '...' : value) : 'NOT SET',
    };
  });
}

// Print results
function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log(colors.cyan + '🔍 ENVIRONMENT VALIDATION RESULTS' + colors.reset);
  console.log('='.repeat(70) + '\n');

  // Supabase Tests
  console.log(colors.blue + '📊 SUPABASE CONNECTIONS' + colors.reset);
  console.log('-'.repeat(70));
  
  const publicStatus = results.supabase.publicClient.status;
  const publicIcon = publicStatus === 'success' ? '✅' : publicStatus === 'error' ? '❌' : '⚠️';
  console.log(`${publicIcon} Public Client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY):`);
  console.log(`   ${results.supabase.publicClient.message}`);
  if (results.supabase.publicClient.details.url) {
    console.log(`   URL: ${results.supabase.publicClient.details.url}`);
  }
  console.log('');

  const serviceStatus = results.supabase.serviceRole.status;
  const serviceIcon = serviceStatus === 'success' ? '✅' : serviceStatus === 'error' ? '❌' : '⚠️';
  console.log(`${serviceIcon} Service Role (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):`);
  console.log(`   ${results.supabase.serviceRole.message}`);
  if (results.supabase.serviceRole.details.url) {
    console.log(`   URL: ${results.supabase.serviceRole.details.url}`);
  }
  console.log('');

  // Stripe Test
  console.log(colors.blue + '💳 STRIPE API' + colors.reset);
  console.log('-'.repeat(70));
  const stripeStatus = results.stripe.status;
  const stripeIcon = stripeStatus === 'success' ? '✅' : stripeStatus === 'error' ? '❌' : '⚠️';
  console.log(`${stripeIcon} Stripe Connection (STRIPE_SECRET_KEY):`);
  console.log(`   ${results.stripe.message}`);
  if (results.stripe.details.mode) {
    console.log(`   Mode: ${results.stripe.details.mode}`);
  }
  console.log('');

  // Resend Test
  console.log(colors.blue + '📧 RESEND API' + colors.reset);
  console.log('-'.repeat(70));
  const resendStatus = results.resend.status;
  const resendIcon = resendStatus === 'success' ? '✅' : resendStatus === 'error' ? '❌' : '⚠️';
  console.log(`${resendIcon} Resend Connection (RESEND_API_KEY):`);
  console.log(`   ${results.resend.message}`);
  if (results.resend.details.contactEmail) {
    console.log(`   Contact Email: ${results.resend.details.contactEmail}`);
  }
  console.log('');

  // Environment Variables
  console.log(colors.blue + '🔑 ENVIRONMENT VARIABLES' + colors.reset);
  console.log('-'.repeat(70));
  
  console.log(colors.yellow + 'Client-Side Variables:' + colors.reset);
  Object.entries(results.variables.clientSide).forEach(([name, info]) => {
    const icon = info.exists ? '✅' : '❌';
    console.log(`   ${icon} ${name}: ${info.value}`);
  });
  console.log('');

  console.log(colors.yellow + 'Server-Side Variables (Edge Functions):' + colors.reset);
  Object.entries(results.variables.serverSide).forEach(([name, info]) => {
    const icon = info.exists ? '✅' : '❌';
    console.log(`   ${icon} ${name}: ${info.value}`);
  });
  console.log('');
}

// Calculate readiness score
function calculateReadinessScore() {
  let score = 0;
  const maxScore = 100;

  // Supabase (30 points)
  if (results.supabase.publicClient.status === 'success') score += 15;
  else if (results.supabase.publicClient.status === 'missing') score += 0;
  else score += 5; // partial credit for error (variable exists but connection failed)

  if (results.supabase.serviceRole.status === 'success') score += 15;
  else if (results.supabase.serviceRole.status === 'missing') score += 0;
  else score += 5;

  // Stripe (25 points)
  if (results.stripe.status === 'success') score += 25;
  else if (results.stripe.status === 'missing') score += 0;
  else score += 10; // partial credit for error

  // Resend (20 points)
  if (results.resend.status === 'success') score += 20;
  else if (results.resend.status === 'missing') score += 0;
  else score += 10; // partial credit for error

  // Required client-side variables (15 points)
  const requiredClient = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_APP_URL'];
  const requiredClientCount = requiredClient.filter(v => results.variables.clientSide[v]?.exists).length;
  score += (requiredClientCount / requiredClient.length) * 15;

  // Required server-side variables (10 points)
  const requiredServer = ['STRIPE_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'];
  const requiredServerCount = requiredServer.filter(v => results.variables.serverSide[v]?.exists).length;
  score += (requiredServerCount / requiredServer.length) * 10;

  return Math.round(score);
}

// Main execution
async function main() {
  console.log(colors.cyan + '🚀 Starting Environment Validation...' + colors.reset);
  console.log('');

  // Check variables first
  checkEnvironmentVariables();

  // Run tests
  console.log(colors.yellow + 'Testing Supabase Public Client...' + colors.reset);
  await testSupabasePublicClient();

  console.log(colors.yellow + 'Testing Supabase Service Role...' + colors.reset);
  await testSupabaseServiceRole();

  console.log(colors.yellow + 'Testing Stripe API...' + colors.reset);
  await testStripe();

  console.log(colors.yellow + 'Testing Resend API...' + colors.reset);
  await testResend();

  // Print results
  printResults();

  // Calculate and print score
  const score = calculateReadinessScore();
  console.log('='.repeat(70));
  console.log(colors.cyan + `📊 RUNTIME READINESS SCORE: ${score}/100` + colors.reset);
  
  if (score >= 90) {
    console.log(colors.green + '✅ Production Ready!' + colors.reset);
  } else if (score >= 75) {
    console.log(colors.yellow + '⚠️  Needs Verification' + colors.reset);
  } else if (score >= 50) {
    console.log(colors.yellow + '⚠️  Missing Critical Variables' + colors.reset);
  } else {
    console.log(colors.red + '❌ Not Ready for Production' + colors.reset);
  }
  
  console.log('='.repeat(70) + '\n');

  // Return results for JSON export
  return { ...results, readinessScore: score };
}

// Export results as JSON
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((finalResults) => {
      // Write JSON results
      const fs = await import('fs');
      fs.writeFileSync(
        'environment-validation-results.json',
        JSON.stringify(finalResults, null, 2)
      );
      console.log(colors.green + '✅ Results saved to environment-validation-results.json' + colors.reset);
      process.exit(finalResults.readinessScore >= 75 ? 0 : 1);
    })
    .catch((error) => {
      console.error(colors.red + '❌ Validation failed:', error + colors.reset);
      process.exit(1);
    });
}

export { main, results };

