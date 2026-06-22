# Interview Question JSON Schema

## Goal

The model must return UI-ready structured question blocks, not raw conversational text.

## Top-Level Shape

```json
{
  "stage": "experience_validation",
  "objective": "Validate real React experience through structured evidence collection",
  "state_updates": {
    "slots_completed": [],
    "slots_pending": [],
    "confidence_updates": {}
  },
  "question": {
    "id": "q_experience_react_01",
    "type": "multi_part",
    "title": "Tell us about your React experience",
    "description": "Answer the short fields below.",
    "required": true,
    "fields": []
  },
  "completion": {
    "should_end": false,
    "reason": null
  }
}
```

## Supported Question Types

### single_choice
Use for one option only.

```json
{
  "type": "single_choice",
  "title": "What is your current employment status?",
  "options": [
    {"label": "Student", "value": "student"},
    {"label": "Employed", "value": "employed"},
    {"label": "Freelancer", "value": "freelancer"},
    {"label": "Unemployed", "value": "unemployed"}
  ]
}
```

### multi_choice
Use for multiple selections.

```json
{
  "type": "multi_choice",
  "title": "Which tools have you used professionally?",
  "options": [
    {"label": "React", "value": "react"},
    {"label": "Next.js", "value": "nextjs"},
    {"label": "Tailwind", "value": "tailwind"},
    {"label": "TypeScript", "value": "typescript"}
  ]
}
```

### dropdown
Use when there are many options but only one answer.

### short_text
Use for compact factual input.

### long_text
Use only for evidence, motivation, or nuanced explanation.

### numeric
Use for years of experience, salary expectations, team size, etc.

### date
Use for availability date or graduation date.

### boolean
Use for simple yes/no.

### multi_part
Use when one card should contain multiple related fields.

## Recommended Field Rules

- prefer single_choice over long_text when possible
- prefer multi_choice for tools/skills lists
- prefer short_text for concise facts
- reserve long_text for:
  - motivation
  - project example
  - problem-solving explanation
- keep one card focused on one objective

## Multi-Part Example

```json
{
  "id": "q_profile_current_status",
  "type": "multi_part",
  "title": "Current situation",
  "description": "Help us understand your current availability and location.",
  "required": true,
  "fields": [
    {
      "key": "employment_status",
      "type": "single_choice",
      "label": "Employment status",
      "required": true,
      "options": [
        {"label": "Student", "value": "student"},
        {"label": "Employed", "value": "employed"},
        {"label": "Freelancer", "value": "freelancer"},
        {"label": "Not working now", "value": "not_working"}
      ]
    },
    {
      "key": "city",
      "type": "short_text",
      "label": "Current city",
      "required": true,
      "placeholder": "e.g. Casablanca"
    },
    {
      "key": "available_in_weeks",
      "type": "numeric",
      "label": "Available in how many weeks?",
      "required": true,
      "min": 0,
      "max": 52
    }
  ]
}
```

## Extra Optional Keys

Each field may include:
- `placeholder`
- `help_text`
- `min`
- `max`
- `max_length`
- `allow_other`
- `other_label`
- `validation_regex`
- `store_as`

## State Update Contract

The model should also propose updates such as:
```json
{
  "state_updates": {
    "slots_completed": ["candidate.city", "candidate.availability"],
    "slots_pending": ["motivation.primary_reason"],
    "confidence_updates": {
      "react_skill": 0.62
    },
    "signals": {
      "communication_clarity": "medium",
      "motivation_strength": "high"
    }
  }
}
```

## Completion Contract

```json
{
  "completion": {
    "should_end": false,
    "reason": null
  }
}
```

Possible reasons:
- `mandatory_slots_filled`
- `max_questions_reached`
- `low_signal_stop`
- `sufficient_confidence`

## Strong Guardrails for Model

The model must:
- return valid JSON only
- never return markdown
- never ask duplicate questions
- not ask more than 4 sub-fields in a multi-part card
- use long_text only if needed
- keep titles short and human
