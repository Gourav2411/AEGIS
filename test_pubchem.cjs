const https = require('https');

const data = new URLSearchParams({ smiles: "C/C=C/C" }).toString();

const options = {
  hostname: 'pubchem.ncbi.nlm.nih.gov',
  path: '/rest/pug/compound/smiles/SDF?record_type=3d',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(res.statusCode);
});
req.write(data);
req.end();
