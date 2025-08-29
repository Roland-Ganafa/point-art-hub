/**
 * Content Security Policy (CSP) and Security Headers Test
 * This script analyzes the HTML and headers for security best practices
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const log = {
  success: (msg) => console.log(`${GREEN}✓ SUCCESS: ${msg}${RESET}`),
  error: (msg) => console.log(`${RED}✗ ERROR: ${msg}${RESET}`),
  warn: (msg) => console.log(`${YELLOW}⚠ WARNING: ${msg}${RESET}`),
  info: (msg) => console.log(`ℹ INFO: ${msg}`),
};

/**
 * Analyzes HTML for security issues
 */
function analyzeHTML() {
  log.info('\n--- Analyzing HTML for Security Issues ---');
  
  try {
    // Read the index.html file
    const htmlPath = path.join(process.cwd(), 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for Content-Security-Policy
    if (html.includes('<meta http-equiv="Content-Security-Policy"')) {
      log.success('Content-Security-Policy meta tag found');
      
      // Extract and analyze the CSP
      const cspMatch = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
      if (cspMatch && cspMatch[1]) {
        analyzeCspDirectives(cspMatch[1]);
      }
    } else {
      log.error('No Content-Security-Policy meta tag found in index.html');
      log.info('Consider adding a CSP meta tag to restrict content sources and prevent XSS attacks');
    }
    
    // Check for X-Content-Type-Options
    if (html.includes('<meta http-equiv="X-Content-Type-Options" content="nosniff"')) {
      log.success('X-Content-Type-Options header is set to prevent MIME type sniffing');
    } else {
      log.warn('X-Content-Type-Options header is not set');
      log.info('Consider adding: <meta http-equiv="X-Content-Type-Options" content="nosniff">');
    }
    
    // Check for X-Frame-Options
    if (html.includes('<meta http-equiv="X-Frame-Options"')) {
      log.success('X-Frame-Options header is set to prevent clickjacking');
    } else {
      log.warn('X-Frame-Options header is not set');
      log.info('Consider adding: <meta http-equiv="X-Frame-Options" content="DENY">');
    }
    
    // Check for Referrer-Policy
    if (html.includes('<meta name="referrer"') || html.includes('<meta http-equiv="Referrer-Policy"')) {
      log.success('Referrer Policy is set to control information passed in the Referer header');
    } else {
      log.warn('Referrer Policy is not set');
      log.info('Consider adding: <meta name="referrer" content="same-origin">');
    }
    
    // Check for inline scripts (potential security risk)
    const inlineScriptCount = (html.match(/<script(?!\s+src=)[^>]*>/g) || []).length;
    if (inlineScriptCount > 0) {
      log.warn(`Found ${inlineScriptCount} inline script tags which may pose XSS risks`);
      log.info('Consider moving inline scripts to external files and using CSP to restrict script sources');
    } else {
      log.success('No inline scripts found - good practice for XSS prevention');
    }
    
    // Check for unsafe eval usage
    if (html.includes('eval(') || html.includes('new Function(')) {
      log.error('Potentially unsafe eval() or new Function() usage detected');
      log.info('Consider removing eval() usage as it creates XSS vulnerabilities');
    } else {
      log.success('No unsafe eval() usage detected in HTML');
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      log.error('Could not find index.html file for analysis');
    } else {
      log.error(`Error analyzing HTML: ${error.message}`);
    }
  }
}

/**
 * Analyzes CSP directives for security issues
 */
function analyzeCspDirectives(csp) {
  // Parse CSP directives
  const directives = {};
  csp.split(';').forEach(directive => {
    const [name, ...values] = directive.trim().split(/\s+/);
    if (name) {
      directives[name] = values;
    }
  });
  
  // Check for unsafe-inline in script-src
  if (directives['script-src'] && directives['script-src'].includes("'unsafe-inline'")) {
    log.error("script-src allows 'unsafe-inline' which is a security risk");
  } else if (directives['script-src']) {
    log.success("script-src correctly restricts inline scripts");
  }
  
  // Check for unsafe-eval in script-src
  if (directives['script-src'] && directives['script-src'].includes("'unsafe-eval'")) {
    log.error("script-src allows 'unsafe-eval' which is a security risk");
  }
  
  // Check for default-src fallback
  if (!directives['default-src']) {
    log.warn("default-src directive is missing - consider adding as a fallback");
  }
  
  // Check for overly permissive sources
  ['script-src', 'style-src', 'img-src', 'connect-src'].forEach(directive => {
    if (directives[directive] && directives[directive].includes('*')) {
      log.warn(`${directive} includes wildcard '*' which is overly permissive`);
    }
  });
}

/**
 * Check for security issues in the service worker
 */
function analyzeServiceWorker() {
  log.info('\n--- Analyzing Service Worker for Security Issues ---');
  
  try {
    // Check if service worker exists
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    if (fs.existsSync(swPath)) {
      log.success('Service Worker file found');
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      // Check for cache implementation
      if (swContent.includes('caches.open(') && swContent.includes('cache.addAll(')) {
        log.success('Service Worker implements caching for offline functionality');
      } else {
        log.warn('Service Worker may not implement proper caching for offline functionality');
      }
      
      // Check for proper event handling
      if (swContent.includes('self.addEventListener(\'install\'') && 
          swContent.includes('self.addEventListener(\'activate\'') && 
          swContent.includes('self.addEventListener(\'fetch\'')) {
        log.success('Service Worker implements proper lifecycle event handling');
      } else {
        log.warn('Service Worker may not implement all required lifecycle events');
      }
      
      // Check for potential security issues
      if (swContent.includes('eval(') || swContent.includes('new Function(')) {
        log.error('Service Worker contains potentially unsafe eval() usage');
      }
      
      if (swContent.includes('importScripts(')) {
        log.warn('Service Worker uses importScripts() - ensure only trusted scripts are imported');
      }
    } else {
      log.info('No Service Worker file found at public/sw.js');
    }
  } catch (error) {
    log.error(`Error analyzing Service Worker: ${error.message}`);
  }
}

/**
 * Run all security header checks
 */
function runSecurityHeaderChecks() {
  console.log('\n=== POINT ART HUB SECURITY HEADERS TEST ===\n');
  
  try {
    analyzeHTML();
    analyzeServiceWorker();
    
    console.log('\n=== SECURITY HEADERS TEST SUMMARY ===');
    console.log('Note: These tests check for security best practices in HTML headers and content.');
    console.log('Consider implementing recommended security headers for better protection.');
    console.log('For production, server-side headers are more reliable than meta tags.');
  } catch (error) {
    console.error('\n=== SECURITY HEADERS TEST FAILED ===');
    console.error('Error:', error);
  }
}

// Run the tests
runSecurityHeaderChecks();