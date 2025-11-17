# Test Organization Guide

This document explains the testing structure, conventions, and best practices for the CPSK Job Connect project.

## Table of Contents

- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [Test Structure](#test-structure)
- [Authentication Patterns](#authentication-patterns)
- [Using Fixtures and Factories](#using-fixtures-and-factories)
- [Creating New Tests](#creating-new-tests)
- [Common Patterns](#common-patterns)
- [Coverage Goals](#coverage-goals)

---

## Directory Structure

```
src/tests/
├── api/                          # API route tests (mirrors src/app/api)
│   ├── admin/                    # Admin API tests
│   │   ├── accounts/
│   │   │   └── approve.test.ts
│   │   ├── dashboard/
│   │   │   ├── stats.logic.test.ts
│   │   │   └── stats.route.test.ts
│   │   └── job-posts/
│   │       └── [id]/
│   │           └── route.test.ts
│   ├── company/                  # Company API tests
│   │   ├── jobs.test.ts
│   │   └── profile.test.ts
│   ├── students/                 # Student API tests
│   │   ├── applications.test.ts
│   │   ├── documents.test.ts
│   │   ├── profile.test.ts
│   │   ├── send-verification.test.ts
│   │   └── verify-email.test.ts
│   └── [other routes]/
├── fixtures/                     # Centralized mock data
│   ├── models.ts                # Base mock models
│   ├── factories.ts             # Factory functions for variations
│   ├── sessions.ts              # Session/auth mocks
│   └── index.ts                 # Central export
├── setup/                        # Test setup utilities
│   ├── mocks.ts                 # Common mock setups
│   └── test-template.ts         # Template for new tests
└── utils/                        # Test utilities
    └── test-helpers.ts          # Legacy helpers (being phased out)
```

### Key Principles:

1. **Mirror API Routes**: Test files mirror the structure of `src/app/api/`
2. **Centralized Fixtures**: All mock data in `fixtures/` directory
3. **Standardized Mocks**: Common mocks in `setup/mocks.ts`
4. **Consistent Patterns**: All tests follow the same structure

---

## Naming Conventions

### File Naming

We use **one standard pattern** for all test files:

```typescript
// Pattern: {feature}.test.ts

✅ CORRECT:
- approve.test.ts          // Single endpoint
- profile.test.ts          // Single feature
- applications.test.ts     // Multiple related endpoints

❌ AVOID:
- route.test.ts           // Too generic
- profile-api.test.ts     // Redundant
- getProfile.test.ts      // Function names instead of feature
```

### Exception: Logic Separation

When business logic is extracted from route handlers:

```typescript
✅ CORRECT:
- stats.route.test.ts     // Tests the route handler (auth, HTTP)
- stats.logic.test.ts     // Tests the business logic (pure functions)

When to separate:
- Complex calculation logic (>50 lines)
- Reusable business functions
- Logic tested independently of HTTP layer
```

### Test Description Naming

```typescript
// Pattern: describe("[METHOD] /api/full/path", () => {})

✅ CORRECT:
describe("GET /api/students/profile", () => {})
describe("POST /api/admin/accounts/approve", () => {})
describe("PATCH /api/company/profile", () => {})

❌ AVOID:
describe("Profile tests", () => {})        // Not specific
describe("Testing student API", () => {})  // Too vague
describe("/api/students/profile", () => {}) // Missing HTTP method
```

---

## Test Structure

### Standard Describe Block Organization

**All tests MUST follow this structure:**

```typescript
describe("[METHOD] /api/path", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // 1. AUTHENTICATION (always first)
  describe("Authentication", () => {
    it("returns 401 if user is not authenticated", async () => {});
    it("returns 401 if session is invalid", async () => {});
  });

  // 2. AUTHORIZATION (role-based access)
  describe("Authorization", () => {
    it("returns 403 if user lacks required role", async () => {});
    it("allows access for authorized role", async () => {});
  });

  // 3. INPUT VALIDATION
  describe("Input Validation", () => {
    it("validates required fields", async () => {});
    it("validates field formats", async () => {});
    it("validates field lengths", async () => {});
    it("sanitizes input data", async () => {});
  });

  // 4. BUSINESS LOGIC
  describe("Business Logic", () => {
    it("successfully performs primary action", async () => {});
    it("handles edge cases", async () => {});
    it("returns 404 when resource not found", async () => {});
  });

  // 5. ERROR HANDLING
  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {});
    it("handles unexpected errors", async () => {});
    it("logs errors appropriately", async () => {});
  });

  // 6. PERFORMANCE (optional)
  describe("Performance", () => {
    it("completes request within acceptable time", async () => {});
  });
});
```

### Why This Order?

1. **Authentication** - Security first, quickest path to rejection
2. **Authorization** - Role checks happen after authentication
3. **Input Validation** - Validate before processing
4. **Business Logic** - Core functionality tests
5. **Error Handling** - Comprehensive error scenarios
6. **Performance** - Optional optimization verification

---

## Authentication Patterns

### STANDARD: Use getApiSession (All New Tests)

**All tests MUST use `getApiSession` from `@/lib/api-auth`:**

```typescript
import { getApiSession } from "@/lib/api-auth";
import { mockStudentSession, mockGetApiSession } from "@/tests/fixtures";

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

describe("GET /api/endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("allows authenticated student", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);

    const res = await GET();

    expect(res.status).toBe(200);
  });
});
```

### LEGACY: getServerSession (Being Phased Out)

**Do NOT use `getServerSession` in new tests.** If you encounter it in existing tests, refactor to use `getApiSession`:

```typescript
// ❌ OLD (Don't use):
import { getServerSession } from "next-auth/next";
(getServerSession as jest.Mock).mockResolvedValue({ user: { email: "..." } });

// ✅ NEW (Use this):
import { getApiSession } from "@/lib/api-auth";
(getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
```

---

## Using Fixtures and Factories

### Import from Central Location

```typescript
import {
  // Base models
  mockStudent,
  mockCompany,
  mockJobPost,
  mockApplication,

  // Factory functions
  createMockStudent,
  createMockCompany,
  createMockJobPost,

  // Batch factories
  createMockStudents,
  createMockJobPosts,

  // Sessions
  mockStudentSession,
  mockCompanySession,
  mockAdminSession,
  createMockSession,
  mockGetApiSession,
  mockUnauthenticatedSession,
} from "@/tests/fixtures";
```

### Using Base Models

For standard cases, use the base models directly:

```typescript
it("returns student profile", async () => {
  (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

  const res = await GET();
  const data = await res.json();

  expect(data.name).toBe(mockStudent.name);
});
```

### Using Factories for Variations

For custom data, use factories with overrides:

```typescript
it("handles pending student", async () => {
  const pendingStudent = createMockStudent({
    verification_status: "PENDING",
    verification_notes: null,
  });

  (prisma.student.findUnique as jest.Mock).mockResolvedValue(pendingStudent);

  const res = await GET();

  expect(res.status).toBe(403);
});
```

### Creating Multiple Records

Use batch factories for lists:

```typescript
it("returns multiple students", async () => {
  const students = createMockStudents(5); // Creates 5 students

  (prisma.student.findMany as jest.Mock).mockResolvedValue(students);

  const res = await GET();
  const data = await res.json();

  expect(data).toHaveLength(5);
});
```

### Customizing Batch Data

```typescript
const companies = createMockCompanies(3, {
  registration_status: "APPROVED",
  verification_notes: null,
});
```

---

## Creating New Tests

### Step 1: Copy the Template

```bash
cp src/tests/setup/test-template.ts src/tests/api/[domain]/[endpoint].test.ts
```

### Step 2: Update Imports

```typescript
// Update the route import
import { GET, POST } from "@/app/api/students/profile/route";

// Import relevant fixtures
import {
  mockStudent,
  mockStudentSession,
  createMockStudent,
} from "@/tests/fixtures";
```

### Step 3: Customize Mock Setup

```typescript
jest.mock("@/lib/db", () => ({
  prisma: createPrismaMock(),
}));

jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

// Add any additional mocks needed
jest.mock("@/lib/uploadImage", () => ({
  uploadImage: jest.fn(),
}));
```

### Step 4: Write Tests Following Standard Structure

Follow the [Test Structure](#test-structure) section above.

### Step 5: Run Tests

```bash
# Run your new test file
npm test src/tests/api/[domain]/[endpoint].test.ts

# Run all tests in the domain
npm run test:students
npm run test:company
npm run test:admin
```

---

## Common Patterns

### Testing Authentication

```typescript
describe("Authentication", () => {
  it("returns 401 if not authenticated", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
```

### Testing Authorization

```typescript
describe("Authorization", () => {
  it("returns 403 for wrong role", async () => {
    // Endpoint requires admin, but student session provided
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("allows admin access", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(mockAdminSession);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      accountRole: { name: "admin" },
    });

    const res = await GET();

    expect(res.status).not.toBe(403);
  });
});
```

### Testing Validation

```typescript
describe("Input Validation", () => {
  beforeEach(() => {
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
  });

  it("validates required fields", async () => {
    const req = new NextRequest("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({}), // Missing required fields
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("required");
  });

  it("validates field length", async () => {
    const req = new NextRequest("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ name: "AB" }), // Too short
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
```

### Testing Database Errors

```typescript
describe("Error Handling", () => {
  it("handles database errors gracefully", async () => {
    (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
    (prisma.student.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database connection failed")
    );

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});
```

### Testing FormData Endpoints

```typescript
it("handles file uploads", async () => {
  (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);

  const formData = new FormData();
  formData.append("name", "John Doe");
  formData.append("logo", new File(["content"], "logo.png"));

  const req = new NextRequest("http://localhost/api/endpoint", {
    method: "POST",
    body: formData as any,
  });

  const res = await POST(req);

  expect(res.status).toBe(200);
});
```

### Testing Parameterized Routes

```typescript
// For routes like /api/students/[id]/route.ts
import { GET } from "@/app/api/students/[id]/route";

it("returns student by ID", async () => {
  (getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
  (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

  const params = Promise.resolve({ id: "1" });
  const res = await GET(new NextRequest("http://localhost"), { params });

  expect(res.status).toBe(200);
});
```

---

## Coverage Goals

### Current Status

- **Total Routes**: 59
- **Tested Routes**: 11 (18.6%)
- **Target Coverage**: 70-75%

### Coverage Thresholds

Set in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 75,
    statements: 75,
  },
}
```

### Priority Routes for Testing

**High Priority (Security Critical):**
1. Authentication endpoints (`/api/auth/*`)
2. Registration (`/api/register`)
3. Admin verification (`/api/admin/verifications/*`)
4. Student verification (`/api/students/verify-email`, `/send-verification`)

**Medium Priority (Core Features):**
5. Job application endpoints (`/api/jobs/apply`, `/api/applications/*`)
6. Profile management (`/api/students/profile`, `/api/company/profile`)
7. Job management (`/api/company/jobs/create`, `/api/jobs/[id]`)
8. Document upload (`/api/students/documents`, `/api/company/documents`)

**Lower Priority (Supporting Features):**
9. Statistics endpoints (`/api/students/[id]/statistics/*`)
10. Notifications (`/api/notification/*`)
11. Saved jobs (`/api/students/saved-jobs`)
12. Analytics (`/api/company/analytics`, `/api/company/stats`)

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
start coverage/lcov-report/index.html  # Windows
open coverage/lcov-report/index.html   # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

---

## Best Practices Checklist

When creating or reviewing tests, ensure:

- [ ] File follows naming convention (`{feature}.test.ts`)
- [ ] Uses `getApiSession` (not `getServerSession`)
- [ ] Imports fixtures from `@/tests/fixtures`
- [ ] Uses `createPrismaMock()` from setup/mocks
- [ ] Follows standard describe block structure
- [ ] Includes Authentication tests
- [ ] Includes Authorization tests (if role-based)
- [ ] Includes Input Validation tests
- [ ] Includes Error Handling tests
- [ ] Has clear, descriptive test names
- [ ] Calls `resetAllMocks()` in `beforeEach`
- [ ] Silences console output with `silenceConsole()`
- [ ] Tests all HTTP methods for the endpoint
- [ ] Includes ASVS compliance comments
- [ ] Has realistic test data
- [ ] Covers edge cases

---

## Migration Guide

### Updating Existing Tests

If you encounter an old-style test, update it to the new standard:

**Step 1: Update imports**
```typescript
// Remove
import { getServerSession } from "next-auth/next";

// Add
import { getApiSession } from "@/lib/api-auth";
import { mockStudentSession, createMockStudent } from "@/tests/fixtures";
```

**Step 2: Update mocks**
```typescript
// Remove
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Add
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));
```

**Step 3: Replace inline mock data with fixtures**
```typescript
// Remove
const mockStudent = { id: 1, name: "Test", ... };

// Add
import { mockStudent, createMockStudent } from "@/tests/fixtures";
```

**Step 4: Update session mocking**
```typescript
// Remove
(getServerSession as jest.Mock).mockResolvedValue({
  user: { email: "test@example.com" }
});

// Add
(getApiSession as jest.Mock).mockResolvedValue(mockStudentSession);
```

---

## Questions?

- **Where do I put test utilities?** → `src/tests/setup/`
- **Where do I put mock data?** → `src/tests/fixtures/`
- **Should I use getServerSession?** → No, use `getApiSession`
- **How do I test file uploads?** → See [Testing FormData Endpoints](#testing-formdata-endpoints)
- **What's the naming convention?** → `{feature}.test.ts`
- **Do I need performance tests?** → Optional, but recommended for critical endpoints

---

## Related Documentation

- [Testing Guide](../../docs/TESTING_GUIDE.md) - Comprehensive testing documentation
- [jest.config.js](../../jest.config.js) - Jest configuration
- [CI/CD Workflow](../../.github/workflows/test.yml) - Automated testing setup
