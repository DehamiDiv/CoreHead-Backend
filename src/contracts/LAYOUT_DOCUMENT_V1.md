# CoreHead LayoutDocument v1

## Purpose

`LayoutDocument v1` is the only canonical structure for newly created manual, visual-builder, imported, migrated, and AI-generated layouts. The machine-readable source is `layout-document-v1.schema.json`.

## Root document

| Field | Required | Meaning |
| --- | --- | --- |
| `schemaVersion` | Yes | Must be `1.0`. |
| `kind` | Yes | `single-post` or `blog-archive`. |
| `name` | Yes | Human-readable template name. |
| `blocks` | Yes | Flat ordered list containing 1-100 blocks. |
| `metadata` | No | Description, design style, and origin. |

Child relationships use `parentId`. IDs must be unique within a document. A block without `parentId` is a root block.

## Supported block types

- `Heading`
- `Paragraph`
- `Image`
- `Quote`
- `Divider`
- `Button`
- `Container`
- `Columns`
- `Collection List`
- `Featured Carousel`
- `Video`
- `Newsletter`
- `Social Links`
- `Spacer`
- `Code Block`
- `Html`
- `Markdown`

Exact type-specific content shapes are defined in the JSON Schema. Producers must not invent block types or additional fields.

## Binding catalogue

Dynamic content is expressed through `bindings.content`. Supported paths are:

- `post.title`
- `post.excerpt`
- `post.content`
- `post.contentHtml`
- `post.contentText`
- `post.coverImage`
- `post.featured_image`
- `post.category`
- `post.slug`
- `post.author.name`
- `post.publishedAt`
- `site.name`
- `site.slug`
- `site.logo`

Bindings are data references, not template expressions. Do not place `{post.title}` into canonical block content.

## Semantic requirements

### Single Post

A usable Single Post layout must contain:

- A block bound to `post.title`.
- A block bound to `post.contentHtml`.

Cover image, excerpt, category, author, and date bindings are optional.

### Blog Archive

A usable Blog Archive layout must contain at least one `Collection List`. Its `limit` must be between 1 and 50.

## LLM generation rules

When generating a layout:

1. Return exactly one JSON object conforming to the schema.
2. Select the requested `kind`; never infer a different kind from visual wording.
3. Use only documented block types, content shapes, binding paths, and styles.
4. Generate unique, stable, descriptive block IDs.
5. Use bindings for dynamic CMS values and static `content` only for intentional labels or supporting copy.
6. A Single Post must bind its title and article body.
7. A Blog Archive must contain a valid `Collection List`.
8. Use `parentId` only when the referenced parent exists and is a `Container` or `Columns` block.
9. Do not emit scripts, event handlers, arbitrary query definitions, or undocumented CSS properties.
10. Return JSON only, without Markdown fences or explanation.

## Lifecycle

```text
create or generate -> normalize -> validate -> preview -> save draft
-> publish -> assign -> resolve -> render
```

AI history is provenance. The site-scoped `templates` record is the selectable and assignable layout artifact.
