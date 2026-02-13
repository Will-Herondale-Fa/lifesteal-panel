const https = require('https');

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SUB_ID = process.env.AZURE_SUBSCRIPTION_ID;
const RG = process.env.AZURE_RESOURCE_GROUP;
const VM_NAME = process.env.AZURE_VM_NAME;

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAzureToken() {
  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://management.azure.com/.default',
  }).toString();

  const res = await httpsRequest(
    {
      hostname: 'login.microsoftonline.com',
      path: `/${TENANT_ID}/oauth2/v2.0/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenBody),
      },
    },
    tokenBody
  );
  return res.body.access_token;
}

module.exports = async function (context, req) {
  try {
    const token = await getAzureToken();

    // Start the VM (not just power on — full start)
    const res = await httpsRequest({
      hostname: 'management.azure.com',
      path: `/subscriptions/${SUB_ID}/resourceGroups/${RG}/providers/Microsoft.Compute/virtualMachines/${VM_NAME}/start?api-version=2024-07-01`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Length': '0',
      },
    });

    // 202 = accepted (async operation started), 200 = already running
    if (res.status === 202 || res.status === 200) {
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'VM start initiated', azureStatus: res.status },
      };
    } else {
      context.res = {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Azure returned unexpected status', azureStatus: res.status, details: res.body },
      };
    }
  } catch (err) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Failed to start VM', details: err.message },
    };
  }
};
