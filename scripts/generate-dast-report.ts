import * as fs from 'fs';
import * as path from 'path';

// Paths
const DAST_JSON_PATH = path.join(__dirname, '..', 'docs', 'security-reports', 'dast', 'dast-baseline-report.json');
const DAST_REPORT_PATH = path.join(__dirname, '..', 'docs', 'security-reports', 'dast', 'DAST_REPORT.md');

interface ZAPAlert {
  pluginid: string;
  alert: string;
  riskcode: string;
  confidence: string;
  riskdesc: string;
  desc: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
  count: string;
  instances: Array<{
    uri: string;
    method: string;
    param: string;
    evidence: string;
  }>;
}

interface ZAPSite {
  '@name': string;
  '@host': string;
  '@port': string;
  alerts: ZAPAlert[];
}

interface ZAPReport {
  '@version': string;
  '@generated': string;
  site: ZAPSite[];
}

// Parse ZAP JSON report
function parseZAPReport(): ZAPReport {
  const rawData = fs.readFileSync(DAST_JSON_PATH, 'utf-8');
  return JSON.parse(rawData);
}

// Get risk level color emoji
function getRiskEmoji(riskcode: string): string {
  switch (riskcode) {
    case '3': return '🔴'; // High
    case '2': return '🟡'; // Medium
    case '1': return '🟢'; // Low
    case '0': return 'ℹ️ '; // Informational
    default: return '❓';
  }
}

// Get risk level text
function getRiskLevel(riskcode: string): string {
  switch (riskcode) {
    case '3': return 'High';
    case '2': return 'Medium';
    case '1': return 'Low';
    case '0': return 'Informational';
    default: return 'Unknown';
  }
}

// Calculate security score
function calculateSecurityScore(alerts: ZAPAlert[]): number {
  if (alerts.length === 0) return 100;

  const highCount = alerts.filter(a => a.riskcode === '3').length;
  const mediumCount = alerts.filter(a => a.riskcode === '2').length;
  const lowCount = alerts.filter(a => a.riskcode === '1').length;

  // Weighted penalty
  const penalty = (highCount * 20) + (mediumCount * 10) + (lowCount * 2);
  return Math.max(0, 100 - penalty);
}

// Get status based on alerts
function getSecurityStatus(alerts: ZAPAlert[]): { emoji: string; status: string; message: string } {
  const highCount = alerts.filter(a => a.riskcode === '3').length;
  const mediumCount = alerts.filter(a => a.riskcode === '2').length;

  if (highCount > 0) {
    return {
      emoji: '🔴',
      status: 'CRITICAL',
      message: 'High severity vulnerabilities detected - immediate action required!'
    };
  } else if (mediumCount > 0) {
    return {
      emoji: '🟡',
      status: 'WARNING',
      message: 'Medium severity issues found - should be addressed soon'
    };
  } else {
    return {
      emoji: '🟢',
      status: 'PASS',
      message: 'No critical or medium severity issues detected'
    };
  }
}

// Map CWE to ASVS
function mapToAVSS(cweid: string): string[] {
  const cweMap: Record<string, string[]> = {
    '693': ['V5.1 - Input Validation', 'V5.3 - Output Encoding'],
    '1021': ['V4.1 - General Access Control'],
    '16': ['V5.2 - Sanitization and Sandboxing', 'V5.3 - Output Encoding'],
    '200': ['V7.4 - Error Handling', 'V9.1 - Communications Security'],
    '209': ['V7.4 - Error Handling'],
    '525': ['V9.1 - Communications Security'],
    '598': ['V9.1 - Communications Security'],
  };

  return cweMap[cweid] || ['General Security'];
}

// Generate markdown report
function generateMarkdownReport(zapReport: ZAPReport): string {
  const site = zapReport.site[0];
  const alerts = site.alerts;

  // Group alerts by risk level
  const alertsByRisk = {
    high: alerts.filter(a => a.riskcode === '3'),
    medium: alerts.filter(a => a.riskcode === '2'),
    low: alerts.filter(a => a.riskcode === '1'),
    info: alerts.filter(a => a.riskcode === '0'),
  };

  const totalIssues = alerts.length;
  const score = calculateSecurityScore(alerts);
  const status = getSecurityStatus(alerts);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + now.toLocaleTimeString('en-GB');

  let report = `# DAST Security Analysis Report

**Generated:** ${formattedDate}
**Project:** CPSK Job Connect
**Analysis Type:** Dynamic Application Security Testing (DAST)
**Tool:** OWASP ZAP ${zapReport['@version']}
**Target:** ${site['@name']}

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Alerts | ${totalIssues} |
| 🔴 High Risk | ${alertsByRisk.high.length} |
| 🟡 Medium Risk | ${alertsByRisk.medium.length} |
| 🟢 Low Risk | ${alertsByRisk.low.length} |
| ℹ️  Informational | ${alertsByRisk.info.length} |
| Security Score | ${score}/100 |

---

## Security Status

${status.emoji} **${status.status}** - ${status.message}

---

## ASVS 4.0.3 Coverage

This DAST scan evaluated the following ASVS requirements:

- **V4: Access Control** - Clickjacking protection, CORS
- **V5: Validation & Encoding** - XSS protection, input validation
- **V7: Error Handling** - Information disclosure
- **V9: Communications** - Security headers, HTTPS configuration
- **V13: API Security** - RESTful web service security

---

## Detailed Findings

`;

  // High Risk Alerts
  if (alertsByRisk.high.length > 0) {
    report += `### 🔴 High Risk Vulnerabilities (${alertsByRisk.high.length})\n\n`;
    alertsByRisk.high.forEach((alert, index) => {
      const avssCoverage = mapToAVSS(alert.cweid);
      report += `#### ${index + 1}. ${alert.alert}\n\n`;
      report += `- **Plugin ID:** ${alert.pluginid}\n`;
      report += `- **Risk Level:** 🔴 ${getRiskLevel(alert.riskcode)}\n`;
      report += `- **Confidence:** ${alert.confidence}\n`;
      report += `- **CWE:** ${alert.cweid}\n`;
      report += `- **WASC:** ${alert.wascid}\n`;
      report += `- **ASVS Coverage:** ${avssCoverage.join(', ')}\n`;
      report += `- **Occurrences:** ${alert.count}\n\n`;
      report += `**Description:**\n${cleanHtml(alert.desc)}\n\n`;
      report += `**Solution:**\n${cleanHtml(alert.solution)}\n\n`;
      report += `**Affected URLs (sample):**\n`;
      alert.instances.slice(0, 3).forEach(instance => {
        report += `- ${instance.method} ${instance.uri}\n`;
      });
      if (parseInt(alert.count) > 3) {
        report += `- ... and ${parseInt(alert.count) - 3} more\n`;
      }
      report += '\n';
    });
  }

  // Medium Risk Alerts
  if (alertsByRisk.medium.length > 0) {
    report += `### 🟡 Medium Risk Issues (${alertsByRisk.medium.length})\n\n`;
    alertsByRisk.medium.forEach((alert, index) => {
      const avssCoverage = mapToAVSS(alert.cweid);
      report += `#### ${index + 1}. ${alert.alert}\n\n`;
      report += `- **Plugin ID:** ${alert.pluginid}\n`;
      report += `- **Risk Level:** 🟡 ${getRiskLevel(alert.riskcode)}\n`;
      report += `- **Confidence:** ${alert.confidence}\n`;
      report += `- **CWE:** ${alert.cweid}\n`;
      report += `- **WASC:** ${alert.wascid}\n`;
      report += `- **ASVS Coverage:** ${avssCoverage.join(', ')}\n`;
      report += `- **Occurrences:** ${alert.count}\n\n`;
      report += `**Description:**\n${cleanHtml(alert.desc)}\n\n`;
      report += `**Solution:**\n${cleanHtml(alert.solution)}\n\n`;
      report += `**Affected URLs (sample):**\n`;
      alert.instances.slice(0, 3).forEach(instance => {
        report += `- ${instance.method} ${instance.uri}\n`;
      });
      if (parseInt(alert.count) > 3) {
        report += `- ... and ${parseInt(alert.count) - 3} more\n`;
      }
      report += '\n';
    });
  }

  // Low Risk Alerts
  if (alertsByRisk.low.length > 0) {
    report += `### 🟢 Low Risk Findings (${alertsByRisk.low.length})\n\n`;
    alertsByRisk.low.forEach((alert, index) => {
      report += `#### ${index + 1}. ${alert.alert}\n\n`;
      report += `- **Plugin ID:** ${alert.pluginid}\n`;
      report += `- **Occurrences:** ${alert.count}\n`;
      report += `- **CWE:** ${alert.cweid}\n\n`;
      report += `**Description:**\n${cleanHtml(alert.desc)}\n\n`;
      report += `**Solution:**\n${cleanHtml(alert.solution)}\n\n`;
    });
  }

  // Informational
  if (alertsByRisk.info.length > 0) {
    report += `### ℹ️  Informational (${alertsByRisk.info.length})\n\n`;
    alertsByRisk.info.forEach((alert, index) => {
      report += `#### ${index + 1}. ${alert.alert}\n`;
      report += `- **Occurrences:** ${alert.count}\n\n`;
    });
  }

  // Recommendations
  report += `---

## Recommendations

### Immediate Actions (High Priority)

`;

  if (alertsByRisk.high.length > 0) {
    report += `1. **Address High Risk Vulnerabilities:** ${alertsByRisk.high.length} critical issues require immediate attention\n`;
    alertsByRisk.high.forEach(alert => {
      report += `   - ${alert.alert}\n`;
    });
  } else {
    report += `✅ No high-risk vulnerabilities detected\n`;
  }

  report += `

### Short-term Improvements (Medium Priority)

`;

  if (alertsByRisk.medium.length > 0) {
    const topMedium = alertsByRisk.medium.slice(0, 5);
    topMedium.forEach((alert, index) => {
      report += `${index + 1}. **${alert.alert}** (${alert.count} occurrences)\n`;
    });
  } else {
    report += `✅ No medium-risk issues detected\n`;
  }

  report += `

### Best Practices (Low Priority)

`;

  if (alertsByRisk.low.length > 0) {
    const topLow = alertsByRisk.low.slice(0, 3);
    topLow.forEach((alert, index) => {
      report += `${index + 1}. ${alert.alert}\n`;
    });
  }

  report += `

---

## Next Steps

1. **Review Report:** Examine all findings in detail, especially high and medium risk items
2. **Implement Fixes:** Address security issues based on priority (High → Medium → Low)
3. **Re-scan:** Run DAST again after implementing fixes to verify remediation
4. **Continuous Testing:** Integrate DAST scans into CI/CD pipeline
5. **Security Headers:** Configure security headers in \`next.config.js\`

---

## Additional Resources

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [ASVS 4.0.3](https://github.com/OWASP/ASVS)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Database](https://cwe.mitre.org/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

---

*CPSK Job Connect - DAST Security Report*
*Generated by OWASP ZAP ${zapReport['@version']}*
`;

  return report;
}

function cleanHtml(text: string): string {
  const replaceUntilStable = (value: string, pattern: RegExp, replacement: string) => {
    let previous: string;
    let current = value;
    do {
      previous = current;
      current = current.replace(pattern, replacement);
    } while (current !== previous);
    return current;
  };

  const entityReplacements: Array<[RegExp, string]> = [
    [/&nbsp;/gi, ' '],
    [/&lt;/gi, '<'],
    [/&gt;/gi, '>'],
    [/&amp;/gi, '&'],
  ];
  const decoded = entityReplacements.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text
  );

  const tagPatterns: Array<[RegExp, string]> = [
    [/<p>/gi, ''],
    [/<\/p>/gi, '\n'],
    [/<br\s*\/?>/gi, '\n'],
    [/<[^>]+>/g, ''],
  ];
  const stripped = tagPatterns.reduce(
    (acc, [pattern, replacement]) => replaceUntilStable(acc, pattern, replacement),
    decoded
  );

  return stripped.replace(/\n{3,}/g, '\n\n').trim();
}

// Main execution
console.log('📊 Generating DAST Security Report...\n');

try {
  // Check if JSON report exists
  if (!fs.existsSync(DAST_JSON_PATH)) {
    console.error('❌ Error: DAST JSON report not found at:', DAST_JSON_PATH);
    console.log('Please run OWASP ZAP scan first');
    process.exit(1);
  }

  // Parse and generate report
  const zapReport = parseZAPReport();
  const markdownReport = generateMarkdownReport(zapReport);

  // Save markdown report
  fs.writeFileSync(DAST_REPORT_PATH, markdownReport, 'utf-8');

  console.log('✅ DAST Report Generation Complete!\n');
  console.log('📄 Reports generated:');
  console.log(`   - Markdown: ${DAST_REPORT_PATH}\n`);

  // Print summary
  const site = zapReport.site[0];
  const alerts = site.alerts;
  const highCount = alerts.filter(a => a.riskcode === '3').length;
  const mediumCount = alerts.filter(a => a.riskcode === '2').length;
  const lowCount = alerts.filter(a => a.riskcode === '1').length;
  const score = calculateSecurityScore(alerts);

  console.log('📊 Summary:');
  console.log(`   - Total Alerts: ${alerts.length}`);
  console.log(`   - High Risk: ${highCount}`);
  console.log(`   - Medium Risk: ${mediumCount}`);
  console.log(`   - Low Risk: ${lowCount}`);
  console.log(`   - Security Score: ${score}/100\n`);

  if (highCount > 0 || mediumCount > 0) {
    console.log('⚠️  Security issues found! Please review the report.');
    process.exit(1);
  } else {
    console.log('✅ No critical security issues detected.');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Error generating DAST report:', error);
  process.exit(1);
}
