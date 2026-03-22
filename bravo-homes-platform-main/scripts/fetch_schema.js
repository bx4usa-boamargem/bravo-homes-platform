import fs from 'fs';
const url = 'https://tyeaqluofishcvhvpwrg.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZWFxbHVvZmlzaGN2aHZwd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjUxNjYsImV4cCI6MjA4OTYwMTE2Nn0.Az3lMMsICgzCwZM94xzx2DQsAyfb7hwzm0XoBFyv6X4';

fetch(url, { headers: { 'apikey': key, 'Accept-Profile': 'public' } })
  .then(r => r.json())
  .then(spec => {
    fs.writeFileSync('schema.json', JSON.stringify(spec, null, 2));
    console.log('Saved to schema.json');
    if (spec.definitions && spec.definitions.projects) {
       console.log('Projects keys:', Object.keys(spec.definitions.projects.properties));
    } else {
       console.log('No projects definition found in spec! Check top-level keys:', Object.keys(spec));
    }
  })
  .catch(console.error);
