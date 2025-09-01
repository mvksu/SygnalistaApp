# Chat Test Suite

This directory contains comprehensive tests for the chat functionality in the application.

## Test Structure

```
tests/
├── api/
│   └── chat.spec.ts              # API tests for message and file upload endpoints
├── components/
│   ├── chat.test.tsx             # Component tests for Chat and ChatMessage
│   └── client-thread.test.tsx    # Integration tests for client thread logic
├── e2e/
│   └── chat.spec.ts              # End-to-end tests using Playwright
├── setup/
│   ├── test-db.ts                # Database setup for integration tests
│   └── test-ids.tsx              # Test ID constants and instructions
└── README.md                     # This file
```

## Test Categories

### 1. API Tests (`tests/api/chat.spec.ts`)

Tests the backend API endpoints for chat functionality:

- **Message Creation**: Tests POST `/api/reports/[id]/messages`
  - Text message creation
  - Empty message for file-only uploads
  - Validation and error handling
  - Authorization checks

- **File Upload**: Tests POST `/api/files/presign`
  - Presigned URL generation
  - File attachment creation
  - Audio file handling
  - Error scenarios

- **Audit Logging**: Verifies audit trail
  - Message creation audit logs
  - File attachment audit logs
  - IP/UA fingerprinting
  - Actor identification

### 2. Component Tests (`tests/components/`)

Tests the React components in isolation:

#### Chat Component (`chat.test.tsx`)
- Message rendering
- User input handling
- File upload UI
- Voice recording UI
- Error states
- Accessibility

#### Client Thread Component (`client-thread.test.tsx`)
- State management
- Message sending flow
- File upload integration
- Optimistic updates
- Error handling

### 3. End-to-End Tests (`tests/e2e/chat.spec.ts`)

Full user journey tests using Playwright:

- Complete message sending flow
- File attachment workflow
- Voice recording and sending
- Error scenarios
- UI interactions
- Cross-browser compatibility

## Running Tests

### Unit and Component Tests
```bash
# Run all tests
npm run test

# Run only API tests
npm run test:unit tests/api/

# Run only component tests
npm run test:unit tests/components/

# Run with coverage
npm run test -- --coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e tests/e2e/chat.spec.ts

# Run in headed mode for debugging
npm run test:e2e -- --headed
```

## Test Data Setup

### Database Setup
The tests use a test database configured via `tests/setup/test-db.ts`. Ensure you have:
- `TEST_DATABASE_URL` environment variable set
- Test database is clean before running tests

### Mock Data
Tests use mocked data for:
- User authentication
- File uploads
- MediaRecorder API
- AudioContext API
- Network requests

## Test IDs

To make components testable, add `data-testid` attributes using the constants from `tests/setup/test-ids.tsx`:

```tsx
import { CHAT_TEST_IDS } from '@/tests/setup/test-ids'

<ScrollArea data-testid={CHAT_TEST_IDS.CHAT_CONTAINER}>
  <textarea data-testid={CHAT_TEST_IDS.MESSAGE_INPUT} />
  <button data-testid={CHAT_TEST_IDS.SEND_BUTTON}>Send</button>
</ScrollArea>
```

## Key Test Scenarios

### Message Sending
1. **Text Messages**: Verify text input, sending, and display
2. **File Attachments**: Test file selection, upload, and display
3. **Voice Messages**: Test recording, playback, and sending
4. **Mixed Content**: Messages with text, files, and audio

### Error Handling
1. **Network Errors**: Failed API calls
2. **Permission Errors**: Microphone access denied
3. **Validation Errors**: Invalid file types, empty messages
4. **Upload Errors**: File upload failures

### User Experience
1. **Real-time Updates**: Optimistic UI updates
2. **Loading States**: Submit button states
3. **Input Clearing**: Form reset after sending
4. **Auto-scroll**: Chat scrolls to bottom

### Security
1. **Authorization**: Role-based access control
2. **Audit Logging**: All actions are logged
3. **File Validation**: Secure file uploads
4. **Input Sanitization**: XSS prevention

## Mocking Strategy

### API Mocks
- Mock external services (Supabase, Clerk)
- Mock database operations
- Mock file uploads
- Mock audit logging

### Browser API Mocks
- `MediaRecorder`: Voice recording
- `AudioContext`: Audio analysis
- `navigator.mediaDevices`: Microphone access
- `URL.createObjectURL`: File previews

### Component Mocks
- Next.js router
- Authentication context
- File input elements
- Audio elements

## Coverage Goals

- **API Endpoints**: 100% coverage
- **Component Logic**: 90%+ coverage
- **User Interactions**: 85%+ coverage
- **Error Scenarios**: 100% coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Scheduled runs

## Debugging Tests

### Component Tests
```bash
# Run with debug output
npm run test -- --verbose

# Run specific test
npm run test -- --grep "sends text message"
```

### E2E Tests
```bash
# Run in headed mode
npm run test:e2e -- --headed

# Run with slow motion
npm run test:e2e -- --headed --slow-mo=1000

# Debug specific test
npm run test:e2e -- --grep "sends text message"
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should clearly describe the scenario
3. **Arrange-Act-Assert**: Follow AAA pattern in test structure
4. **Mock External Dependencies**: Don't rely on external services
5. **Test User Behavior**: Focus on user actions and expectations
6. **Error Scenarios**: Always test error cases
7. **Accessibility**: Test keyboard navigation and screen readers

## Future Enhancements

- [ ] Visual regression tests
- [ ] Performance testing
- [ ] Load testing for concurrent users
- [ ] Mobile device testing
- [ ] Accessibility audit tests
- [ ] Security penetration tests
