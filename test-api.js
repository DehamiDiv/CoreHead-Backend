const http = require('http');

const data = JSON.stringify({
  prompt: "Design a premium dark-mode tech blog post layout. Include a large cover Image, a Heading for the post title, and a Quote block. Below that, add a two-column section: a Paragraph block on the left for the article content, and a Button plus a Collection List on the right.",
  kind: "single-post"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/ai/generate-layout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(responseData);
      console.log("IS_FALLBACK:", parsed.isFallback);
      console.log("BLOCKS COUNT:", parsed.blocks ? parsed.blocks.length : 'none');
      if (parsed.isFallback) console.log("FAILED WITH FALLBACK.");
      else console.log("SUCCESS!");
    } catch(e) {
      console.log("BODY:", responseData.slice(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
