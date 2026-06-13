// Minimal app.js
document.getElementById('save').addEventListener('click', () => {
  const entry = document.getElementById('entry').value || '';
  const now = new Date().toISOString();
  const records = JSON.parse(localStorage.getItem('mwt:entries') || '[]');
  records.push({timestamp: now, text: entry});
  localStorage.setItem('mwt:entries', JSON.stringify(records));
  alert('Saved');
});
