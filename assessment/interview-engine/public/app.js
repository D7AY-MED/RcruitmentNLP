const api = {
  start: "/api/interview/start",
  answer: "/api/interview/answer",
  report: (sessionId) => `/api/interview/report/${sessionId}`,
};

const state = {
  sessionId: null,
  question: null,
  progress: null,
  objective: "",
};

const el = {
  statusBadge: document.getElementById("statusBadge"),
  startScreen: document.getElementById("startScreen"),
  assessmentScreen: document.getElementById("assessmentScreen"),
  loadingScreen: document.getElementById("loadingScreen"),
  completeScreen: document.getElementById("completeScreen"),
  startForm: document.getElementById("startForm"),
  candidateIdInput: document.getElementById("candidateIdInput"),
  questionTitle: document.getElementById("questionTitle"),
  questionDescription: document.getElementById("questionDescription"),
  stageLabel: document.getElementById("stageLabel"),
  turnLabel: document.getElementById("turnLabel"),
  percentLabel: document.getElementById("percentLabel"),
  progressFill: document.getElementById("progressFill"),
  answerForm: document.getElementById("answerForm"),
  submitBtn: document.getElementById("submitBtn"),
  formError: document.getElementById("formError"),
  reportJson: document.getElementById("reportJson"),
  optionTemplate: document.getElementById("optionTemplate"),
};

el.startForm.addEventListener("submit", onStart);
el.submitBtn.addEventListener("click", onSubmit);

function setStatus(text, mode = "ready") {
  el.statusBadge.textContent = text;
  el.statusBadge.dataset.mode = mode;
}

function show(screen) {
  for (const panel of [el.startScreen, el.assessmentScreen, el.loadingScreen, el.completeScreen]) {
    panel.classList.add("hidden");
  }
  screen.classList.remove("hidden");
}

function showError(message) {
  el.formError.textContent = message;
  el.formError.classList.remove("hidden");
}

function clearError() {
  el.formError.textContent = "";
  el.formError.classList.add("hidden");
}

async function onStart(event) {
  event.preventDefault();
  clearError();
  const candidateId = el.candidateIdInput.value.trim();
  if (!candidateId) {
    showError("Candidate ID is required.");
    return;
  }

  setStatus("Starting", "loading");
  show(el.loadingScreen);
  try {
    const response = await fetch(api.start, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to start interview");

    state.sessionId = data.sessionId;
    state.question = data.question;
    state.progress = data.progress;
    updateAssessmentUI();
    setStatus("In Progress", "active");
    show(el.assessmentScreen);
  } catch (error) {
    setStatus("Error", "error");
    show(el.startScreen);
    showError(error.message);
  }
}

async function onSubmit() {
  clearError();
  if (!state.question || !state.sessionId) return;

  const parsed = collectAnswer(state.question, el.answerForm);
  if (!parsed.ok) {
    showError(parsed.error);
    return;
  }

  setStatus("Submitting", "loading");
  show(el.loadingScreen);
  el.submitBtn.disabled = true;
  try {
    const response = await fetch(api.answer, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        questionId: state.question.id,
        answer: parsed.answer,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to submit answer");

    if (data.status === "completed") {
      await loadReport(state.sessionId);
      setStatus("Completed", "done");
      show(el.completeScreen);
      return;
    }

    state.question = data.question;
    state.progress = data.progress;
    updateAssessmentUI();
    setStatus("In Progress", "active");
    show(el.assessmentScreen);
  } catch (error) {
    setStatus("Error", "error");
    show(el.assessmentScreen);
    showError(error.message);
  } finally {
    el.submitBtn.disabled = false;
  }
}

function updateAssessmentUI() {
  const q = state.question;
  const p = state.progress || { stage: "assessment", turnCount: 0, percent: 0 };
  el.stageLabel.textContent = humanizeStage(p.stage);
  el.turnLabel.textContent = `Turn ${p.turnCount}`;
  el.percentLabel.textContent = `${p.percent}%`;
  el.progressFill.style.width = `${Math.max(0, Math.min(100, p.percent))}%`;
  el.questionTitle.textContent = q.title || "Next question";
  el.questionDescription.textContent = q.description || "";
  renderQuestion(q, el.answerForm);
}

function renderQuestion(question, container) {
  container.innerHTML = "";
  if (question.type === "single_choice") {
    container.appendChild(renderOptions(question, "radio"));
    return;
  }
  if (question.type === "multi_choice") {
    container.appendChild(renderOptions(question, "checkbox"));
    return;
  }
  if (question.type === "dropdown") {
    container.appendChild(renderSelect(question, question.id, question.required));
    return;
  }
  if (question.type === "short_text" || question.type === "long_text" || question.type === "numeric") {
    container.appendChild(renderSimpleField(question, question.id, question.type, question.required));
    return;
  }
  if (question.type === "multi_part") {
    for (const field of question.fields || []) {
      container.appendChild(renderFieldByType(field, field.key, field.required));
    }
    return;
  }
  container.appendChild(renderSimpleField(question, question.id, "short_text", true));
}

function renderFieldByType(field, key, required) {
  if (field.type === "single_choice") return renderOptions(field, "radio", key);
  if (field.type === "multi_choice") return renderOptions(field, "checkbox", key);
  if (field.type === "dropdown") return renderSelect(field, key, required);
  return renderSimpleField(field, key, field.type, required);
}

function renderOptions(schema, inputType, nameOverride) {
  const wrap = document.createElement("div");
  const label = document.createElement("p");
  label.className = "field-title";
  label.textContent = schema.label || schema.title;
  wrap.appendChild(label);
  for (const option of schema.options || []) {
    const node = el.optionTemplate.content.firstElementChild.cloneNode(true);
    const input = node.querySelector("input");
    const span = node.querySelector("span");
    input.type = inputType;
    input.name = nameOverride || schema.id;
    input.value = option.value;
    span.textContent = option.label;
    wrap.appendChild(node);
  }
  return wrap;
}

function renderSelect(schema, key, required) {
  const wrap = document.createElement("label");
  wrap.innerHTML = `${schema.label || schema.title}`;
  const select = document.createElement("select");
  select.name = key;
  if (required) select.required = true;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select an option";
  select.appendChild(placeholder);
  for (const option of schema.options || []) {
    const o = document.createElement("option");
    o.value = option.value;
    o.textContent = option.label;
    select.appendChild(o);
  }
  wrap.appendChild(select);
  return wrap;
}

function renderSimpleField(schema, key, type, required) {
  const wrap = document.createElement("label");
  wrap.textContent = schema.label || schema.title;
  const input = type === "long_text" ? document.createElement("textarea") : document.createElement("input");
  input.name = key;
  if (type === "numeric") input.type = "number";
  if (required) input.required = true;
  if (schema.placeholder) input.placeholder = schema.placeholder;
  if (schema.max_length) input.maxLength = Number(schema.max_length);
  wrap.appendChild(input);
  return wrap;
}

function collectAnswer(question, form) {
  if (question.type === "single_choice") {
    const checked = form.querySelector(`input[name="${question.id}"]:checked`);
    if (question.required && !checked) return { ok: false, error: "Please select one option." };
    return { ok: true, answer: { value: checked ? checked.value : null } };
  }
  if (question.type === "multi_choice") {
    const checked = [...form.querySelectorAll(`input[name="${question.id}"]:checked`)].map((x) => x.value);
    if (question.required && checked.length === 0) return { ok: false, error: "Please select at least one option." };
    return { ok: true, answer: { value: checked } };
  }
  if (question.type === "dropdown") {
    const select = form.querySelector(`select[name="${question.id}"]`);
    if (question.required && !select.value) return { ok: false, error: "Please choose one option." };
    return { ok: true, answer: { value: select.value } };
  }
  if (question.type === "short_text" || question.type === "long_text" || question.type === "numeric") {
    const input = form.querySelector(`[name="${question.id}"]`);
    const value = input.value?.trim();
    if (question.required && !value) return { ok: false, error: "This field is required." };
    return { ok: true, answer: { value: question.type === "numeric" && value ? Number(value) : value } };
  }
  if (question.type === "multi_part") {
    const output = {};
    for (const field of question.fields || []) {
      if (field.type === "single_choice") {
        const checked = form.querySelector(`input[name="${field.key}"]:checked`);
        if (field.required && !checked) return { ok: false, error: `Please answer: ${field.label}` };
        output[field.key] = checked ? checked.value : null;
        continue;
      }
      if (field.type === "multi_choice") {
        const checked = [...form.querySelectorAll(`input[name="${field.key}"]:checked`)].map((x) => x.value);
        if (field.required && checked.length === 0) return { ok: false, error: `Please answer: ${field.label}` };
        output[field.key] = checked;
        continue;
      }
      if (field.type === "dropdown") {
        const select = form.querySelector(`select[name="${field.key}"]`);
        if (field.required && !select.value) return { ok: false, error: `Please answer: ${field.label}` };
        output[field.key] = select.value || null;
        continue;
      }
      const input = form.querySelector(`[name="${field.key}"]`);
      const value = input.value?.trim();
      if (field.required && !value) return { ok: false, error: `Please answer: ${field.label}` };
      output[field.key] = field.type === "numeric" && value ? Number(value) : value;
    }
    return { ok: true, answer: output };
  }
  return { ok: false, error: "Unsupported question format." };
}

function humanizeStage(stage) {
  if (!stage) return "Assessment";
  return stage
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

async function loadReport(sessionId) {
  try {
    const response = await fetch(api.report(sessionId));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No report available");
    el.reportJson.textContent = JSON.stringify(data.report, null, 2);
  } catch (error) {
    el.reportJson.textContent = `Report not available yet: ${error.message}`;
  }
}
