/**
 * Codebase Security Scanner
 * Scans the codebase for common security vulnerabilities
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

// Patterns to search for
const VULNERABILITY_PATTERNS = [
  {
    name: 'Hardcoded Credentials',
    // Pattern looks for password/secret/key/token/auth followed by = or : and then a quoted string
    // Minimum 3 characters to avoid flagging empty strings or single characters
    // The {3,}? is a non-greedy match for 3 or more characters
    pattern: /(password|secret|key|token|auth)[\s]*[=:][\s]*(["'])[^\2]{3,}?\2/gi,
    severity: 'HIGH',
    description: 'Potential hardcoded credentials',
    excludePatterns: [
      'process.env', 
      'import.meta.env', 
      'localStorage',
      'test-key',
      'test-anon-key',
      'pending_sync_queue',
      'offline_pending_sync_queue',
      'storage_key',
      'test_prefix_',
      '""', // Empty strings
      "''",  // Empty strings
      "Key=", // React component keys
      "key:"  // Object keys
    ]
  },
  {
    name: 'Insecure Direct Object References',
    pattern: /\.params\.id|\[params\.id\]|params\["id"\]|req\.params\.id/gi,
    severity: 'MEDIUM',
    description: 'Potential IDOR vulnerability',
    excludePatterns: ['authorize', 'permission', 'check']
  },
  {
    name: 'SQL Injection',
    pattern: /raw\(|execute\(|query\(.*\$\{/gi,
    severity: 'HIGH',
    description: 'Potential SQL injection vulnerability',
    excludePatterns: []
  },
  {
    name: 'Cross-site Scripting (XSS)',
    pattern: /dangerouslySetInnerHTML|innerHTML\s*=/gi,
    severity: 'HIGH',
    description: 'Potential XSS vulnerability',
    excludePatterns: []
  },
  {
    name: 'Insecure Authentication',
    pattern: /setTimeout\s*\(\s*logoutUser|setTimeout\s*\(\s*session/gi,
    severity: 'MEDIUM',
    description: 'Potential insecure authentication handling',
    excludePatterns: []
  },
  {
    name: 'Weak Encryption',
    pattern: /md5|sha1|createCipher\(/gi,
    severity: 'MEDIUM',
    description: 'Usage of weak encryption algorithms',
    excludePatterns: []
  },
  {
    name: 'Insecure Deserialization',
    pattern: /JSON\.parse\s*\(\s*.*\)/gi,
    severity: 'LOW',
    description: 'Potential insecure deserialization',
    excludePatterns: ['JSON.parse(JSON.stringify', 'try {', 'catch']
  },
  {
    name: 'Potential Information Exposure',
    pattern: /console\.log\s*\(\s*.*password|console\.log\s*\(\s*.*secret/gi,
    severity: 'MEDIUM',
    description: 'Logging sensitive information',
    excludePatterns: [
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_URL'
    ]
  },
  {
    name: 'Insecure File Operations',
    pattern: /writeFile|readFile|unlink|fs\./gi,
    severity: 'LOW',
    description: 'File operations that may be insecure',
    excludePatterns: []
  },
  {
    name: 'Cross-Site Request Forgery (CSRF)',
    pattern: /fetch\s*\(\s*["'].*["']\s*,\s*\{.*credentials:\s*["']include["']/gi,
    severity: 'MEDIUM',
    description: 'Potential CSRF vulnerability',
    excludePatterns: ['csrf', 'token']
  },
  {
    name: 'Security Misconfiguration',
    pattern: /NODE_ENV\s*===?\s*["']development["']|isDevelopment|process\.env\.DEBUG/gi,
    severity: 'LOW',
    description: 'Potential security misconfiguration',
    excludePatterns: []
  },
  {
    name: 'Insecure Random Values',
    pattern: /Math\.random\(\)|Date\.now\(\)/gi,
    severity: 'LOW',
    description: 'Usage of insecure random value generation',
    excludePatterns: ['test', 'animation', 'color', 'style']
  },
  {
    name: 'Sensitive Data Exposure',
    pattern: /\.log\s*\(\s*user|\.log\s*\(\s*password|\.log\s*\(\s*auth|\.log\s*\(\s*session/gi,
    severity: 'MEDIUM',
    description: 'Logging sensitive user data',
    excludePatterns: []
  },
  {
    name: 'Path Traversal',
    pattern: /path\.join\s*\(\s*.*\,\s*.*\.\.\//gi,
    severity: 'MEDIUM',
    description: 'Potential path traversal vulnerability',
    excludePatterns: []
  },
  {
    name: 'Use of Vulnerable Dependencies',
    pattern: /\/\/\s*FIXME|\/\/\s*TODO: Security/gi,
    severity: 'LOW',
    description: 'Potential security issue marked in comments',
    excludePatterns: []
  }
];

// File extensions to scan
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git'];

/**
 * Scans a file for security vulnerabilities
 */
function scanFile(filePath, vulnerabilities) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    VULNERABILITY_PATTERNS.forEach(pattern => {
      const regex = new RegExp(pattern.pattern);
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Check if the match should be excluded
        const contextStart = Math.max(0, match.index - 30);
        const contextEnd = Math.min(content.length, match.index + match[0].length + 30);
        const context = content.substring(contextStart, contextEnd);
        
        const shouldExclude = pattern.excludePatterns.some(excludePattern => 
          context.includes(excludePattern)
        );
        
        if (!shouldExclude) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          vulnerabilities.push({
            file: relativePath,
            line: lineNumber,
            vulnerability: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            context: match[0]
          });
        }
      }
    });
  } catch (error) {
    log.error(`Error scanning file ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively scans a directory for security vulnerabilities
 */
function scanDirectory(dirPath, vulnerabilities) {
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(file)) {
          scanDirectory(filePath, vulnerabilities);
        }
      } else if (stat.isFile() && FILE_EXTENSIONS.includes(path.extname(filePath))) {
        scanFile(filePath, vulnerabilities);
      }
    }
  } catch (error) {
    log.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Runs the security scan
 */
function runSecurityScan() {
  console.log('\n=== POINT ART HUB CODEBASE SECURITY SCAN ===\n');
  
  const vulnerabilities = [];
  
  log.info('Scanning codebase for security vulnerabilities...');
  log.info('This may take a few moments...');
  
  try {
    // Scan the src directory
    scanDirectory(path.join(process.cwd(), 'src'), vulnerabilities);
    
    console.log('\n=== SCAN RESULTS ===\n');
    
    if (vulnerabilities.length === 0) {
      log.success('No potential security vulnerabilities found');
    } else {
      // Group vulnerabilities by severity
      const highSeverity = vulnerabilities.filter(v => v.severity === 'HIGH');
      const mediumSeverity = vulnerabilities.filter(v => v.severity === 'MEDIUM');
      const lowSeverity = vulnerabilities.filter(v => v.severity === 'LOW');
      
      log.error(`Found ${vulnerabilities.length} potential security vulnerabilities:`);
      log.error(`- ${highSeverity.length} high severity`);
      log.warn(`- ${mediumSeverity.length} medium severity`);
      log.info(`- ${lowSeverity.length} low severity`);
      
      console.log('\n=== HIGH SEVERITY ISSUES ===\n');
      if (highSeverity.length === 0) {
        log.success('No high severity issues found');
      } else {
        highSeverity.forEach((v, i) => {
          console.log(`${RED}[${i+1}] ${v.vulnerability}${RESET} (${v.file}:${v.line})`);
          console.log(`    ${v.description}`);
          console.log(`    Context: ${v.context}`);
          console.log('');
        });
      }
      
      console.log('\n=== MEDIUM SEVERITY ISSUES ===\n');
      if (mediumSeverity.length === 0) {
        log.success('No medium severity issues found');
      } else {
        mediumSeverity.forEach((v, i) => {
          console.log(`${YELLOW}[${i+1}] ${v.vulnerability}${RESET} (${v.file}:${v.line})`);
          console.log(`    ${v.description}`);
          console.log(`    Context: ${v.context}`);
          console.log('');
        });
      }
      
      console.log('\n=== LOW SEVERITY ISSUES ===\n');
      if (lowSeverity.length > 0) {
        log.info(`Found ${lowSeverity.length} low severity issues`);
        log.info('(These are often false positives or low-risk issues)');
      } else {
        log.success('No low severity issues found');
      }
    }
    
    console.log('\n=== SECURITY SCAN SUMMARY ===');
    console.log('Note: This scan provides a basic security assessment.');
    console.log('False positives may occur, and manual review is recommended.');
    console.log('For a comprehensive security audit, professional tools and review are recommended.');
  } catch (error) {
    console.error('\n=== SECURITY SCAN FAILED ===');
    console.error('Error:', error);
  }
}

// Run the scan
runSecurityScan();