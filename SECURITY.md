# Security Policy

This project follows strict security practices for dependency management and vulnerability remediation, in alignment with **OWASP ASVS 15.1.1**.

---

## 1. Dependency & Vulnerability Monitoring

This project depends on the following major third-party libraries and frameworks:

- Next.js 15  
- Prisma ORM  
- NextAuth  
- Supabase JS  
- React 19  
- Radix UI / Mantine / TailwindCSS  
- Zod  
- date-fns, DOMPurify, sanitize-html  
- Additional npm packages listed in `package.json`

To ensure dependency security, the project uses:

### Automated Monitoring
- **GitHub Dependabot**  
  - Daily scanning for vulnerable dependencies  
  - Automatic pull requests for safe versions  
  - Security advisory alerts  
- **GitHub Security Alerts**

### Manual & CI-based Monitoring
- `npm audit`  
- `npm audit --production`  
- CI security checks:  
  - `security:sast`  
  - `security:audit`

---

## 2. Regular Update Schedule

| Component | Update Frequency | Notes |
|----------|------------------|-------|
| Next.js | Every 2 weeks | Frequent critical patch releases |
| Prisma ORM | Monthly | DB engine & schema security fixes |
| NextAuth | Monthly | Authentication-related updates |
| Supabase JS | Every 2 weeks | API & security patches |
| UI libraries | Monthly | Radix / Mantine / TailwindCSS |
| Utility libraries | Monthly | Zod, DOMPurify, date-fns, etc. |
| DevDependencies | Monthly | Linting/testing tools |

---

## 3. Vulnerability Remediation SLAs (OWASP ASVS 15.1.1)

If a vulnerable dependency is detected, the project follows the remediation timeline below:

| Severity (CVSS) | Required Fix Time | Action |
|-----------------|-------------------|--------|
| **Critical (9.0–10)** | **24 hours** | Patch or rollback immediately |
| **High (7.0–8.9)** | **72 hours** | Upgrade dependency or apply mitigation |
| **Medium (4.0–6.9)** | **Within 7 days** | Review and update |
| **Low (0.1–3.9)** | **Within 30 days** | Update in the next cycle |

If direct fixes are blocked due to breaking changes, temporary mitigations must be applied.

---

## 4. Vulnerability Detection Workflow

### Automated Workflow (Dependabot + CI)

1. Dependabot scans daily for vulnerabilities.  
2. If detected, Dependabot opens a pull request with the recommended update.  
3. CI pipelines run:  
   - Unit tests  
   - `npm audit`  
   - `security:sast`  
   - `security:audit`  
4. A maintainer reviews the severity, changelog, and compatibility.  
5. The update is merged based on the SLA table.  
6. Critical-severity updates require immediate maintainer action.

### Manual Checks

Developers may run:
1. `npm audit`
2. `npm outdated`
3. `npm run security:audit`

---

## 5. Dependabot Configuration

Dependabot is enabled using the following file:

**Path:**  
.github/dependabot.yml


**Purpose:**  
- Schedules version checks  
- Applies security patches automatically  
- Ensures compliance with OWASP ASVS 15.1.1  
- Helps maintain regular update cycles

---

## 6. Reporting a Security Issue

If you discover a vulnerability:

- **Do not** submit a public GitHub issue.  
- Instead use one of the following channels:  
  - GitHub **Security Advisory**  
  - Direct private contact with project maintainers  

All reports are handled promptly according to the SLA table.

---

## 7. Security Standard Compliance

This project adheres to:

- **OWASP ASVS 15.1.1 – Dependency Remediation Policy**  
- **OWASP ASVS 15.1.x – Components and Supply-Chain Security**  
- Best practices for secure dependency management  
- Continuous monitoring using both automation and CI

---

**End of Security Policy**
