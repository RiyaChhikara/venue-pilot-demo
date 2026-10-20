(function () {
  const examples = {
    availability: 'Hello, we are planning our wedding for 12 June 2027 with around 120 guests. Is the Orangery available for a ceremony and reception?',
    access: 'Hi, we love the Garden Room. My partner uses a wheelchair. Is there step-free access to the room and courtyard for our ceremony?',
    outside: 'Hello, we are looking at a Saturday in September for 150 people in the Burdett Suite. Can we bring our own caterer?'
  };
  const input = document.getElementById('enquiry');
  const draftButton = document.getElementById('draft-btn');
  const result = document.getElementById('result-content');
  const empty = document.getElementById('empty-state');
  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = examples[button.dataset.example];
      input.focus();
    });
  });
  draftButton.addEventListener('click', () => {
    const answer = window.VenuePilotAgent.analyze(input.value);
    if (!String(input.value || '').trim()) {
      input.focus();
      return;
    }
    document.getElementById('draft').textContent = answer.draft;
    document.getElementById('score').textContent = `${answer.score}/5`;
    document.getElementById('human-status').textContent = answer.needsHuman ? 'Yes' : 'No known flag';
    document.getElementById('human-summary').textContent = answer.needsHuman ? 'Review flagged before any reply' : 'Team still approves the draft';
    document.getElementById('human-metric').classList.toggle('alert', answer.needsHuman);
    fillList('missing-list', answer.missing.length ? answer.missing : ['No key details missing from the enquiry']);
    fillList('reason-list', answer.reasons.length ? answer.reasons : ['No unsupported or sensitive fact detected']);
    const sourceBox = document.getElementById('sources');
    sourceBox.replaceChildren();
    answer.sources.forEach((source) => {
      const span = document.createElement('span');
      span.className = 'source-chip';
      span.textContent = source;
      sourceBox.appendChild(span);
    });
    empty.classList.add('hidden');
    result.classList.remove('hidden');
  });
  function fillList(id, items) {
    const list = document.getElementById(id);
    list.replaceChildren();
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }
})();