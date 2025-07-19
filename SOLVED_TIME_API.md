# Manual Solved Time Editing API

## Overview
This API now supports manual editing of solved timestamps for issues, which automatically recalculates the time taken to solve. This is useful for ensuring data accuracy when issues were solved at different times than when they were marked as solved in the system.

## New Endpoints

### 1. Update Issue (Enhanced)
**PUT** `/api/issues/:id`

#### Request Body (all fields optional):
```json
{
  "location": "Updated location",
  "issueType": "MAINTENANCE",
  "status": "SOLVED",
  "solvedAt": "2025-07-17T14:30:00.000Z"
}
```

#### New `solvedAt` field behavior:
- **Setting a date**: Automatically sets status to "SOLVED" if not explicitly provided
- **Setting to null**: Automatically sets status to "OPEN" if not explicitly provided  
- **Validation**: Ensures solvedAt is after submittedAt

### 2. Update Solved Time (New Dedicated Endpoint)
**PATCH** `/api/issues/:id/solved-time`

#### Request Body:
```json
{
  "solvedAt": "2025-07-17T14:30:00.000Z"
}
```

Or to clear the solved time:
```json
{
  "solvedAt": null
}
```

#### Features:
- Dedicated endpoint for solved time updates
- Automatic status management (SOLVED/OPEN)
- Validation that solvedAt > submittedAt
- Better error messages

## Updated Responses

### Stats Endpoint Enhanced
**GET** `/api/issues/stats`

Now returns both formats for average solve time:
```json
{
  "success": true,
  "data": {
    "totalClaims": 150,
    "openClaims": 45,
    "solvedClaims": 105,
    "uniqueIssueNumbers": 23,
    "todayClaims": 8,
    "avgSolveTimeMinutes": 720,
    "avgSolveTimeFormatted": "12h",
    "period": {
      "startDate": "All time",
      "endDate": "All time"
    }
  }
}
```

### Excel Export Enhanced
The Excel export now shows time in human-readable format:
- **Minutes**: "45m"
- **Hours**: "2h 30m" or "5h"
- **Days**: "2d 5h 30m", "1d 3h", or "3d"

## Usage Examples

### Frontend JavaScript Examples:

#### 1. Update solved time using the dedicated endpoint:
```javascript
const updateSolvedTime = async (issueId, solvedAt) => {
  try {
    const response = await fetch(`/api/issues/${issueId}/solved-time`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ solvedAt }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update solved time');
    }
    
    const data = await response.json();
    console.log('Solved time updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating solved time:', error);
    throw error;
  }
};

// Usage
updateSolvedTime('issue-id-123', '2025-07-17T14:30:00.000Z');
```

#### 2. Clear solved time (mark as unsolved):
```javascript
updateSolvedTime('issue-id-123', null);
```

#### 3. Update issue with solved time via general update endpoint:
```javascript
const updateIssue = async (issueId, updates) => {
  try {
    const response = await fetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update issue');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
};

// Usage - update multiple fields including solved time
updateIssue('issue-id-123', {
  location: 'Updated Location',
  solvedAt: '2025-07-17T14:30:00.000Z'
});
```

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid date format or solvedAt before submittedAt
- **404 Not Found**: Issue not found
- **Validation errors**: Clear error messages for invalid inputs

Example error response:
```json
{
  "success": false,
  "error": "Solved time cannot be before or equal to submitted time",
  "status": 400
}
```

## Benefits

1. **Data Accuracy**: Manually correct solved times for better reporting
2. **Automatic Calculations**: Time-to-solve is automatically recalculated
3. **Consistent Formatting**: Both API and Excel export use the same time format
4. **Status Management**: Status automatically updates based on solved time
5. **Validation**: Prevents invalid data entry
6. **Backward Compatibility**: Existing functionality remains unchanged
