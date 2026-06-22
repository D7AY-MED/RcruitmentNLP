insert into tst_interview_templates (
  id,
  name,
  role,
  config_json,
  active
)
values (
  'tmpl_dynamic_assessment_v1',
  'Dynamic AI Assessment v1',
  'Adaptive',
  '{
    "role": "Adaptive",
    "stages": [
      "phase_1_study_experience",
      "phase_2_technical_deep_dive",
      "phase_3_soft_skills_behavior",
      "phase_4_motivation_growth",
      "phase_5_logistics_closing"
    ],
    "phasePlan": [
      {
        "stage": "phase_1_study_experience",
        "objective": "Collect concise baseline profile: study, experience level, current status.",
        "targetQuestions": 3
      },
      {
        "stage": "phase_2_technical_deep_dive",
        "objective": "Probe technical depth using concrete evidence and follow-up on weak signals.",
        "targetQuestions": 4
      },
      {
        "stage": "phase_3_soft_skills_behavior",
        "objective": "Assess communication, collaboration, ownership, and conflict handling.",
        "targetQuestions": 3
      },
      {
        "stage": "phase_4_motivation_growth",
        "objective": "Assess motivation quality, goals, and growth mindset.",
        "targetQuestions": 2
      },
      {
        "stage": "phase_5_logistics_closing",
        "objective": "Confirm availability, constraints, and final confidence checks.",
        "targetQuestions": 2
      }
    ],
    "mandatorySlots": [
      "education_level",
      "current_status",
      "years_experience",
      "core_skills",
      "technical_evidence",
      "team_collaboration_evidence",
      "motivation_primary_reason",
      "availability_weeks"
    ],
    "competencies": [
      "technical_depth",
      "problem_solving",
      "communication",
      "teamwork",
      "ownership",
      "motivation"
    ],
    "allowedQuestionTypes": [
      "single_choice",
      "multi_choice",
      "dropdown",
      "short_text",
      "long_text",
      "numeric",
      "date",
      "boolean",
      "multi_part"
    ],
    "maxTurns": 14,
    "tone": "professional_friendly",
    "objective": "100% adaptive interview: personalized deep-dive from the first turn with fast, user-friendly structured questions."
  }'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  config_json = excluded.config_json,
  active = excluded.active,
  updated_at = now();
