const demoLog = document.getElementById('demo-log');
const endpoints = Array.from(document.querySelectorAll('.endpoint'));
let cloudVisible = false;

function alignScenePulseLines() {
  const board = document.querySelector('.scene-board');
  const host = board && board.querySelector('.node.host');
  if (!board || !host || board.getClientRects().length === 0) return;

  const boardRect = board.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const hostCenterX = hostRect.left + hostRect.width / 2;
  const hostCenterY = hostRect.top + hostRect.height / 2;
  const links = [
    ['.line-a', '.endpoint-b'],
    ['.line-b', '.endpoint-a'],
    ['.line-c', '.endpoint-d'],
    ['.line-d', '.endpoint-c']
  ];

  links.forEach(([lineSelector, endpointSelector]) => {
    const line = board.querySelector(lineSelector);
    const endpoint = board.querySelector(endpointSelector);
    if (!line || !endpoint) return;

    const endpointRect = endpoint.getBoundingClientRect();
    const endpointCenterX = endpointRect.left + endpointRect.width / 2;
    const endpointCenterY = endpointRect.top + endpointRect.height / 2;
    const endpointIsRight = endpointCenterX > hostCenterX;
    const startX = endpointIsRight ? hostRect.right : hostRect.left;
    const endX = endpointIsRight ? endpointRect.left : endpointRect.right;
    const dx = endX - startX;
    const dy = endpointCenterY - hostCenterY;

    line.style.right = 'auto';
    line.style.bottom = 'auto';
    line.style.left = (startX - boardRect.left) + 'px';
    line.style.top = (hostCenterY - boardRect.top - line.offsetHeight / 2) + 'px';
    line.style.width = Math.hypot(dx, dy) + 'px';
    line.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
  });
  board.classList.add('lines-ready');
}

function scheduleScenePulseAlignment() {
  window.requestAnimationFrame(alignScenePulseLines);
}

scheduleScenePulseAlignment();
window.addEventListener('resize', scheduleScenePulseAlignment);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleScenePulseAlignment);
}

function makeJobId() {
  return 'preview-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function renderDemoLog(lines) {
  demoLog.innerHTML = lines.map((line) => '<span class="log-line ' + (line.kind || '') + '">' + line.text + '</span>').join('');
}

document.getElementById('trigger-demo').addEventListener('click', () => {
  const jobId = makeJobId();
  endpoints.forEach((endpoint) => endpoint.classList.remove('active'));
  renderDemoLog([
    { text: 'preview_id: ' + jobId, kind: 'ok' },
    { text: 'job_id: ' + jobId, kind: 'ok' },
    { text: 'route_type: local preview', kind: 'ok' },
    { text: 'cloud_compute: optional, not used', kind: 'warn' },
    { text: 'CloudBeasts action preview accepted' }
  ]);
  endpoints.forEach((endpoint, index) => {
    window.setTimeout(() => {
      endpoint.classList.add('active');
      const node = endpoint.dataset.node;
      endpoint.querySelector('span').textContent = node + ' previewed ' + jobId;
      demoLog.insertAdjacentHTML('beforeend', '<span class="log-line ok">node_id: ' + node + ' preview propagation</span>');
      demoLog.scrollTop = demoLog.scrollHeight;
    }, 420 + index * 360);
  });
});

document.getElementById('toggle-cloud').addEventListener('click', () => {
  cloudVisible = !cloudVisible;
  const jobId = makeJobId();
  renderDemoLog([
    { text: 'preview_id: ' + jobId, kind: 'ok' },
    { text: 'job_id: ' + jobId, kind: 'ok' },
    { text: 'route_type: ' + (cloudVisible ? 'hybrid preview' : 'local preview'), kind: cloudVisible ? 'warn' : 'ok' },
    { text: 'cloud_compute: ' + (cloudVisible ? 'optional expansion for heavier workloads' : 'optional, not default'), kind: 'warn' },
    { text: 'local endpoints remain the starting point' }
  ]);
});

function calculateRoi() {
  const screens = Math.max(0, Number(document.getElementById('screens').value || 0));
  const devices = Math.max(0, Number(document.getElementById('devices').value || 0));
  const zones = Math.max(1, Number(document.getElementById('zones').value || 1));
  const network = document.getElementById('network').value;
  const cloud = document.getElementById('cloud').value;
  const footprint = screens + devices;
  const minNodes = Math.max(1, Math.floor(footprint * 0.25));
  const maxNodes = Math.max(minNodes, Math.floor(footprint * 0.6));
  const pilotSize = Math.max(3, Math.min(12, Math.ceil(footprint / Math.max(2, zones * 2))));
  const zonePotential = network === 'segmented' ? zones + ' scoped zones pending network review' : zones + ' coordinated zones to evaluate';
  const qualification = cloud === 'yes' ? 'Optional cloud route can be evaluated after the local demo.' : cloud === 'unsure' ? 'Start with the local demo, then decide whether cloud is useful.' : 'Local-only pilot recommended first.';
  document.getElementById('roi-results').innerHTML = '<h3>You may already have the foundation for a coordinated environment.</h3><div class="result-grid"><div class="result-item"><span>Estimated device footprint</span><strong>' + footprint + ' devices</strong></div><div class="result-item"><span>Coordinated-zone potential</span><strong>' + zonePotential + '</strong></div><div class="result-item"><span>Estimated active-node range</span><strong>' + minNodes + '-' + maxNodes + ' nodes</strong></div><div class="result-item"><span>Suggested pilot size</span><strong>' + pilotSize + ' devices</strong></div></div><p class="notice">Traditional comparison: review what a display-management or AV refresh would require for the same footprint. ' + qualification + '</p><a class="button" href="#demo-request">Book a live demo</a>';
}

document.getElementById('roi-form').addEventListener('submit', (event) => {
  event.preventDefault();
  calculateRoi();
});
['screens', 'devices', 'zones', 'network', 'cloud'].forEach((id) => document.getElementById(id).addEventListener('input', calculateRoi));
calculateRoi();

function populateTrackingFields() {
  const params = new URLSearchParams(window.location.search);
  const mapping = {
    'referral-source': params.get('ref') || params.get('referral') || '',
    'utm-source': params.get('utm_source') || '',
    'utm-medium': params.get('utm_medium') || '',
    'utm-campaign': params.get('utm_campaign') || ''
  };
  for (const [id, value] of Object.entries(mapping)) {
    const field = document.getElementById(id);
    if (field) field.value = value;
  }
}

function handleHoneypot(form) {
  const hp = form.querySelector('input[name="company_website"]');
  return hp && hp.value.trim().length > 0;
}

function prepareMailtoForm(form, subject, bodyBuilder) {
  form.addEventListener('submit', (event) => {
    if (handleHoneypot(form)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const body = bodyBuilder();
    window.location.href = 'mailto:hello@80labs.to?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
}

populateTrackingFields();

prepareMailtoForm(document.getElementById('waitlist'), 'CloudBeasts waitlist request', () => {
  const firstName = document.getElementById('first-name').value.trim() || 'there';
  const email = document.getElementById('email').value.trim();
  const devices = document.getElementById('home-devices').value;
  const interest = document.getElementById('interest').value;
  const referral = document.getElementById('referral-source').value;
  const code = 'CB-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const output = document.getElementById('waitlist-output');
  output.classList.add('visible');
  output.innerHTML = '<h3>' + firstName + ', your request is ready.</h3><p class="notice">Referral code: <strong>' + code + '</strong>. Send the prepared email so the team can count your submission.</p>';
  return ['First name: ' + firstName, 'Email: ' + email, 'Estimated devices: ' + devices, 'Interest: ' + interest, 'Referral source: ' + referral, 'Generated referral code: ' + code, 'Timestamp: ' + new Date().toISOString()].join('\n');
});

prepareMailtoForm(document.getElementById('demo-form'), 'CloudBeasts live demo request', () => {
  return [
    'Name: ' + document.getElementById('demo-name').value,
    'Email: ' + document.getElementById('demo-email').value,
    'Company: ' + document.getElementById('demo-company').value,
    'Role: ' + document.getElementById('demo-role').value,
    'Screens/devices: ' + document.getElementById('demo-devices').value,
    'Zones/locations: ' + document.getElementById('demo-zones').value,
    'Network shape: ' + document.getElementById('demo-network').value,
    'Cloud policy: ' + document.getElementById('demo-cloud').value,
    'Successful demo: ' + document.getElementById('demo-success').value,
    'Timestamp: ' + new Date().toISOString()
  ].join('\n');
});

