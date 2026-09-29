# Security Specification - Sober Living House Manager

## Data Invariants
- A goal must belong to a resident and a house.
- A goal's progress must be between 0 and 100.
- Only residents can create and update their own goals.
- Managers can view all goals and signed compliance documents in their assigned house.
- Compliance documents (Program Terms, House Rules, Treatment Plans) are signed by residents and stored as immutable records.
- Incident reports can only be created by managers or authorized personnel.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a goal with a different `residentId` than the authenticated user.
2. **State Shortcutting**: Attempt to update a goal's progress directly to 100% without valid state transitions (if applicable, though here progress is flexible).
3. **Resource Poisoning**: Goal title exceeding 1000 characters.
4. **House Hijacking**: Attempt to read goals from a `houseId` the user is not part of.
5. **Unauthorized Status Change**: Attempting to change a goal's status to 'completed' when progress is < 100.
6. **Immutable Field Mutation**: Attempting to change `createdAt` on update.
7. **Cross-House Update**: Attempting to update a goal in House A with a reference to House B.
8. **Malicious Progress**: Setting progress to -1 or 101.
9. **Role Escalation**: Resident attempting to create an `incident` report.
10. **Orphaned Writes**: Creating a goal for a house that does not exist.
11. **PII Leak**: Accessing the `users` collection directly to get all emails.
12. **Shadow Field Injection**: Adding an `isAdmin: true` field to a goal or user profile.

## Test Runner (Verifying PERMISSION_DENIED)
... (Skipping implementation of .test.ts for now as per immediate task but identifying the payloads is key)
