# Nested Post Notification Issue Fix

## Problem Description

When creating nested posts (派生質問), the system was incorrectly triggering "deadline ended" notifications instead of "nested post created" notifications. This occurred because:

1. Nested posts were being created with vote deadlines very close to the current time
2. The PostDetail component's periodic deadline checker (every 30 seconds) would immediately check newly created posts
3. If the deadline was already passed or very close, it would trigger deadline notifications instead of letting the nested post creation notifications work properly

## Root Causes Identified

1. **Race condition**: Database trigger for nested post notifications vs. frontend deadline checker
2. **Insufficient deadline validation**: No minimum time buffer for vote deadlines
3. **Immediate deadline checking**: PostDetail component checked deadlines immediately after page load
4. **No protection for new posts**: No mechanism to prevent deadline notifications for very recently created posts

## Solutions Implemented

### 1. Enhanced Schema Validation (`/src/utils/schema.tsx`)

- Added minimum 5-minute buffer for nested post vote deadlines
- Prevents creation of posts with deadlines too close to current time

```typescript
.refine((date) => {
  const now = new Date();
  const minDeadline = new Date(now.getTime() + 5 * 60 * 1000); // 5分後
  return date > minDeadline;
}, {
  message: "投票期限は現在時刻から5分以上先を選択してください",
})
```

### 2. PostDetail Component Deadline Checker Improvements (`/src/components/Post/PostDetail.tsx`)

- Added 30-second delay before checking deadlines for new posts
- Prevents immediate deadline checks that could conflict with nested post creation

### 3. Enhanced Notification Utility (`/src/utils/notifications.ts`)

- Added post creation time validation to deadline notification function
- Prevents deadline notifications for posts created less than 1 minute ago
- Added detailed logging for debugging

### 4. Database Function Improvements (`fix_nested_post_notification_system.sql`)

- Enhanced `check_deadline_notification_not_sent()` to consider post age
- Improved nested post notification trigger with better validation and logging
- Added `should_check_deadline_notification()` function to prevent notifications for very new posts
- Updated `create_deadline_notifications()` to use new validation

## Testing Recommendations

1. **Create a nested post with a short deadline (6-10 minutes)**:

   - Verify only "nested post created" notification is sent to target voters
   - Verify no "deadline ended" notification is sent immediately

2. **Wait for the deadline to actually pass**:

   - Verify "deadline ended" notification is sent after the actual deadline
   - Verify no duplicate notifications

3. **Create multiple nested posts quickly**:
   - Verify each creates its own "nested post created" notification
   - Verify no race conditions or duplicate deadline notifications

## Files Modified

1. `/src/utils/schema.tsx` - Enhanced deadline validation
2. `/src/components/Post/PostDetail.tsx` - Improved deadline checking logic
3. `/src/utils/notifications.ts` - Enhanced notification validation
4. `fix_nested_post_notification_system.sql` - Database function improvements
5. `debug_notification_issue.sql` - Debug queries for investigation

## Monitoring

After applying these fixes, monitor the notifications table for:

- Proper "nested_post_created" notifications when nested posts are created
- No premature "vote_deadline_ended" notifications
- Accurate timing of deadline notifications

Use the debug queries in `debug_notification_issue.sql` to monitor notification behavior.
