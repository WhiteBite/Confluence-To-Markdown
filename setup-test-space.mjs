// Create test space hierarchy with attachments
const BASE = 'http://localhost:8090';
const AUTH = 'Basic ' + Buffer.from('admin:admin').toString('base64');

async function api(method, path, body) {
  const opts = { method, headers: { Authorization: AUTH } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(`${BASE}${path}`, opts);
  if (!r.ok) {
    const t = await r.text();
    console.error(`${method} ${path} -> ${r.status}: ${t}`);
    return null;
  }
  return r.json();
}

async function createPage(title, parentId, bodyHtml) {
  const body = {
    type: 'page', title,
    space: { key: 'E2E' },
    ancestors: parentId ? [{ id: String(parentId) }] : [],
    body: { storage: { value: bodyHtml, representation: 'storage' } }
  };
  const page = await api('POST', '/rest/api/content', body);
  if (page) console.log(`  ${page.id} - ${title}`);
  return page?.id;
}

async function addAttachment(pageId, filename, content, contentType) {
  const boundary = '----FormBoundary' + Date.now();
  const payload = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
    `Content-Type: ${contentType}\r\n\r\n`,
    content,
    `\r\n--${boundary}--\r\n`
  ].join('');

  const r = await fetch(`${BASE}/rest/api/content/${pageId}/child/attachment`, {
    method: 'POST',
    headers: {
      Authorization: AUTH,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-Atlassian-Token': 'nocheck'
    },
    body: payload
  });
  if (r.ok) {
    const j = await r.json();
    console.log(`    + attachment: ${filename} (${content.length} bytes)`);
  } else {
    console.error(`    ! failed to upload ${filename}: ${r.status}`);
  }
}

async function main() {
  const HOME = '1409028';
  console.log('Creating page hierarchy...');

  // 1. Architecture Overview
  const archId = await createPage('Architecture Overview', HOME,
    `<h2>System Architecture</h2>
     <p>Our system uses a <strong>microservices</strong> approach:</p>
     <ul>
       <li>Frontend (React + TypeScript)</li>
       <li>API Gateway (Nginx reverse proxy)</li>
       <li>Backend Services (Node.js + Express)</li>
       <li>Database (PostgreSQL 15)</li>
       <li>Cache (Redis 7)</li>
     </ul>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">javascript</ac:parameter>
       <ac:plain-text-body><![CDATA[const config = {
  port: 3000,
  db: 'postgres://localhost/app',
  redis: 'redis://localhost:6379'
};]]></ac:plain-text-body>
     </ac:structured-macro>
     <h3>Deployment Diagram</h3>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">none</ac:parameter>
       <ac:plain-text-body><![CDATA[graph LR
  Browser --> Nginx
  Nginx --> API[Node.js API]
  API --> PG[(PostgreSQL)]
  API --> Redis[(Redis)]]]></ac:plain-text-body>
     </ac:structured-macro>`);

  // 2. API Reference
  const apiId = await createPage('API Reference', HOME,
    `<h2>API Reference</h2>
     <p>Complete API documentation for all endpoints.</p>
     <ac:structured-macro ac:name="info">
       <ac:rich-text-body><p>All API endpoints require authentication via Bearer token.</p></ac:rich-text-body>
     </ac:structured-macro>
     <p>See child pages for detailed endpoint documentation.</p>`);

  // 3. REST API (child of API Reference)
  const restId = await createPage('REST API', apiId,
    `<h2>REST API Endpoints</h2>
     <table>
       <tr><th>Method</th><th>Path</th><th>Description</th></tr>
       <tr><td>GET</td><td>/api/users</td><td>List all users</td></tr>
       <tr><td>POST</td><td>/api/users</td><td>Create user</td></tr>
       <tr><td>GET</td><td>/api/users/:id</td><td>Get user by ID</td></tr>
       <tr><td>PUT</td><td>/api/users/:id</td><td>Update user</td></tr>
       <tr><td>DELETE</td><td>/api/users/:id</td><td>Delete user</td></tr>
     </table>
     <h3>Example Request</h3>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">bash</ac:parameter>
       <ac:plain-text-body><![CDATA[curl -H "Authorization: Bearer $TOKEN" \\
  https://api.example.com/api/users?page=1&limit=20]]></ac:plain-text-body>
     </ac:structured-macro>`);

  // 4. GraphQL API (child of API Reference)
  const gqlId = await createPage('GraphQL API', apiId,
    `<h2>GraphQL API</h2>
     <p>Endpoint: <code>/graphql</code></p>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">javascript</ac:parameter>
       <ac:plain-text-body><![CDATA[query GetUsers($limit: Int) {
  users(limit: $limit) {
    id
    name
    email
    role
  }
}]]></ac:plain-text-body>
     </ac:structured-macro>
     <h3>Mutations</h3>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">javascript</ac:parameter>
       <ac:plain-text-body><![CDATA[mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    name
  }
}]]></ac:plain-text-body>
     </ac:structured-macro>`);

  // 5. Configuration Guide
  const cfgId = await createPage('Configuration Guide', HOME,
    `<h2>Configuration</h2>
     <h3>Environment Variables</h3>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">bash</ac:parameter>
       <ac:plain-text-body><![CDATA[DATABASE_URL=postgres://user:pass@localhost:5432/app
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
JWT_SECRET=your-secret-key
PORT=3000]]></ac:plain-text-body>
     </ac:structured-macro>
     <h3>Docker Compose</h3>
     <ac:structured-macro ac:name="code">
       <ac:parameter ac:name="language">yaml</ac:parameter>
       <ac:plain-text-body><![CDATA[version: "3.8"
services:
  api:
    image: myapp:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/app
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data]]></ac:plain-text-body>
     </ac:structured-macro>`);

  // 6. Troubleshooting (child of Config)
  const trId = await createPage('Troubleshooting', cfgId,
    `<h2>Common Issues</h2>
     <ol>
       <li><strong>Connection refused</strong> — Check firewall rules and ensure services are running</li>
       <li><strong>Timeout errors</strong> — Increase <code>timeout</code> in config.json</li>
       <li><strong>Memory issues</strong> — Set <code>NODE_OPTIONS=--max-old-space-size=4096</code></li>
       <li><strong>Disk full</strong> — Rotate logs and clean temp files</li>
     </ol>
     <ac:structured-macro ac:name="warning">
       <ac:rich-text-body><p>Always backup your database before applying migrations!</p></ac:rich-text-body>
     </ac:structured-macro>`);

  // Add attachments
  console.log('\nAdding attachments...');

  // CSV on REST API page
  const csv = 'id,name,email,role\n1,Alice,alice@example.com,admin\n2,Bob,bob@example.com,user\n3,Charlie,charlie@example.com,user\n4,Diana,diana@example.com,manager\n';
  if (restId) await addAttachment(restId, 'users.csv', csv, 'text/csv');

  // JSON on REST API page
  const json = JSON.stringify({
    api_version: '2.1.0',
    endpoints: [
      { method: 'GET', path: '/api/users', auth: true },
      { method: 'POST', path: '/api/users', auth: true },
      { method: 'GET', path: '/api/health', auth: false }
    ]
  }, null, 2);
  if (restId) await addAttachment(restId, 'api-schema.json', json, 'application/json');

  // JSON config on Configuration page
  const configJson = JSON.stringify({
    database: { host: 'localhost', port: 5432, name: 'app', pool: 10 },
    redis: { host: 'localhost', port: 6379 },
    logging: { level: 'debug', format: 'json', output: 'stdout' },
    features: { darkMode: true, betaApi: false, rateLimit: 100 }
  }, null, 2);
  if (cfgId) await addAttachment(cfgId, 'config.json', configJson, 'application/json');

  // CSV on Architecture page
  const metricsCsv = 'service,cpu_avg,memory_mb,p99_latency_ms\napi-gateway,15%,256,45\nuser-service,22%,512,120\nauth-service,8%,128,30\n';
  if (archId) await addAttachment(archId, 'metrics.csv', metricsCsv, 'text/csv');

  console.log('\nDone! Summary:');
  console.log(`Homepage (${HOME})`);
  console.log(`  Architecture Overview (${archId})`);
  console.log(`    + metrics.csv`);
  console.log(`  API Reference (${apiId})`);
  console.log(`    REST API (${restId})`);
  console.log(`      + users.csv, api-schema.json`);
  console.log(`    GraphQL API (${gqlId})`);
  console.log(`  Configuration Guide (${cfgId})`);
  console.log(`    + config.json`);
  console.log(`    Troubleshooting (${trId})`);
}

main().catch(console.error);
