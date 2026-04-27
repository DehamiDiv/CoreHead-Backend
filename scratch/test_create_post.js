const http = require('http');

const data = JSON.stringify({
  title: "Test Post",
  slug: "test-post",
  excerpt: "This is a test post.",
  authorId: "1",
  categories: ["Tech"],
  status: "Published",
  featured: false,
  content: "This is the content of the test post.",
  thumbnailUrl: ""
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
