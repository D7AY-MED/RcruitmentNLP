# State Model

## Purpose

The state model replaces full transcript replay.

## Session State Example

```json
{
  "session_id": "sess_123",
  "current_stage": "technical_validation",
  "turn_count": 6,
  "rolling_summary": {
    "candidate_profile": {
      "city": "Casablanca",
      "availability_weeks": 2,
      "employment_status": "student"
    },
    "motivation": {
      "primary_reason": "wants growth and real project impact",
      "strength": "high"
    },
    "communication": {
      "clarity": "medium_high",
      "conciseness": "medium"
    }
  },
  "slots": {
    "react_years": {
      "status": "filled",
      "value": 2,
      "confidence": 0.78
    },
    "project_example_react": {
      "status": "filled",
      "value": "dashboard for internal analytics",
      "confidence": 0.73
    },
    "team_collaboration_example": {
      "status": "missing",
      "value": null,
      "confidence": 0.0
    }
  },
  "asked_question_ids": [
    "q_intro_01",
    "q_profile_current_status",
    "q_motivation_01"
  ],
  "completion_rules": {
    "mandatory_slots_remaining": 4,
    "max_turns": 14
  }
}
```

## Slot Status Values
- missing
- partial
- filled
- verified

## Why This Helps
- less prompt size
- faster model calls
- better control
- easier recruiter scoring
- easier analytics
