const { Groq } = require('groq-sdk');
const groq = new Groq({ apiKey: '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' });
const systemPrompt = `You generate CoreHead CMS layouts.
Return exactly one JSON object and no markdown or explanation.
The requested kind is "single-post". The root kind MUST match it.
Use design style "modern".
Requested optional features: {}.
The document MUST contain bindings.content="post.title" and bindings.content="post.contentHtml". Use post.coverImage for a dynamic cover when an Image is included. Do not add a Collection List unless explicitly requested.
Use dynamic bindings for CMS values. Do not put {post.title} placeholder strings in content.
Use unique string IDs. parentId may only reference a Container or Columns block. Never emit scripts, event handlers, javascript: URLs, arbitrary CSS properties, or undocumented fields.
CRITICAL: The ONLY allowed block types (the "type" field) are: "Heading", "Paragraph", "Image", "Quote", "Divider", "Button", "Container", "Columns", "Collection List", "Video", "Spacer". DO NOT invent any other block types.
The following JSON Schema is the complete LayoutDocument v1 contract:
{"type":"object","properties":{"schemaVersion":{"type":"string"},"kind":{"type":"string"},"name":{"type":"string"},"blocks":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"type":{"type":"string"},"content":{"type":"string"},"parentId":{"type":"string"},"bindings":{"type":"object"},"styles":{"type":"object"}}}}}}`;

const userPrompt = `Create a single-post layout for this request:
Design a premium dark-mode tech blog post layout. Include a large cover Image, a Heading for the post title, and a Quote block. Below that, add a two-column section: a Paragraph block on the left for the article content, and a Button plus a Collection List on the right.`;

console.log("Requesting Groq...");
groq.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  model: 'llama-3.1-8b-instant',
  temperature: 0.2,
  response_format: { type: 'json_object' },
}).then(res => {
  console.log("RESPONSE:\n", res.choices[0].message.content);
}).catch(console.error);
