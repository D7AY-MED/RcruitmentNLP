# API Contracts

## 1. Start Interview

### Request
`POST /api/interview/start`

```json
{
  "candidateId": "cand_123",
  "templateId": "tmpl_software_engineer_v1"
}
```

### Response
```json
{
  "sessionId": "sess_123",
  "status": "in_progress",
  "question": {}
}
```

## 2. Submit Answer

### Request
`POST /api/interview/answer`

```json
{
  "sessionId": "sess_123",
  "questionId": "q_profile_current_status",
  "answer": {
    "employment_status": "student",
    "city": "Casablanca",
    "available_in_weeks": 2
  }
}
```

### Response
```json
{
  "sessionId": "sess_123",
  "status": "in_progress",
  "question": {},
  "progress": {
    "stage": "motivation",
    "turnCount": 3,
    "percent": 24
  }
}
```

## 3. Resume Interview

### Request
`GET /api/interview/session/:sessionId`

### Response
```json
{
  "sessionId": "sess_123",
  "status": "in_progress",
  "lastQuestion": {},
  "progress": {}
}
```

## 4. Complete Interview

### Request
Automatic or explicit submit after final turn.

### Response
```json
{
  "sessionId": "sess_123",
  "status": "completed",
  "finalReportId": "rep_123"
}
```

## Internal Engine Contract

### Engine Input
```json
{
  "template": {},
  "sessionState": {},
  "lastQuestion": {},
  "latestAnswer": {}
}
```

### Engine Output
```json
{
  "question": {},
  "stateUpdates": {},
  "completion": {
    "shouldEnd": false,
    "reason": null
  },
  "telemetry": {
    "model": "fast-turn-model",
    "latencyMs": 1200,
    "tokenUsage": {
      "input": 600,
      "output": 220
    }
  }
}
```

## Final Report Contract

```json
{
  "candidateId": "cand_123",
  "sessionId": "sess_123",
  "role": "Software Engineer",
  "summary": "Candidate shows strong practical React experience with good communication.",
  "competencies": [
    {
      "name": "React",
      "score": 4,
      "confidence": 0.82,
      "evidence": [
        "Described production React dashboard work",
        "Explained component state tradeoffs clearly"
      ]
    }
  ],
  "motivation": {
    "strength": "high",
    "notes": "Motivated by growth and real product ownership"
  },
  "redFlags": [],
  "recommendation": "shortlist"
}
```
