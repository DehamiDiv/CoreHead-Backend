const schema = require('./layout-document-v1.schema.json');

const BLOCK_TYPES = Object.freeze(
  schema.$defs.block.oneOf.map((entry) => {
    const definitionName = entry.$ref.split('/').at(-1);
    return schema.$defs[definitionName].properties.type.const;
  }),
);
const BINDING_PATHS = Object.freeze(schema.$defs.bindingPath.enum);
const STYLE_PROPERTIES = Object.freeze(Object.keys(schema.$defs.styles.properties));
const CONTAINER_TYPES = new Set(['Container', 'Columns']);
const BINDABLE_TYPES = new Set([
  'Heading',
  'Paragraph',
  'Image',
  'Quote',
  'Button',
  'Html',
  'Markdown',
]);
const COMMON_BLOCK_KEYS = new Set(['id', 'type', 'content', 'parentId', 'styles', 'bindings']);
const BLOCK_KEYS = {
  Heading: new Set([...COMMON_BLOCK_KEYS, 'level']),
  Paragraph: COMMON_BLOCK_KEYS,
  Image: COMMON_BLOCK_KEYS,
  Quote: COMMON_BLOCK_KEYS,
  Divider: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Button: COMMON_BLOCK_KEYS,
  Container: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Columns: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  'Collection List': new Set(['id', 'type', 'content', 'parentId', 'styles']),
  'Featured Carousel': new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Video: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Newsletter: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  'Social Links': new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Spacer: new Set(['id', 'type', 'content', 'parentId', 'styles']),
  'Code Block': new Set(['id', 'type', 'content', 'parentId', 'styles']),
  Html: COMMON_BLOCK_KEYS,
  Markdown: COMMON_BLOCK_KEYS,
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function ownKeysOnly(value, allowed) {
  return Object.keys(value).filter((key) => !allowed.has(key));
}

function isString(value, maxLength = Infinity) {
  return typeof value === 'string' && value.length <= maxLength;
}

function isIntegerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isSafeUrl(value, allowEmpty = false) {
  if (!isString(value, 5000)) return false;
  const trimmed = value.trim();
  if (allowEmpty && trimmed === '') return true;
  if (trimmed === '' || /^javascript:/i.test(trimmed) || /^data:text\/html/i.test(trimmed)) {
    return false;
  }
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(trimmed);
}

function validateLayoutDocumentV1(input, options = {}) {
  const errors = [];
  const warnings = [];
  const semantic = options.semantic !== false;

  const addError = (code, path, message, blockId) => {
    errors.push({ code, path, message, ...(blockId ? { blockId } : {}) });
  };

  if (!isObject(input)) {
    addError('document.type', '$', 'Layout document must be a JSON object.');
    return { valid: false, errors, warnings };
  }

  const unknownRootKeys = ownKeysOnly(
    input,
    new Set(['schemaVersion', 'kind', 'name', 'blocks', 'metadata']),
  );
  for (const key of unknownRootKeys) {
    addError('document.unknown_property', `$.${key}`, `Unknown document property "${key}".`);
  }

  if (input.schemaVersion !== '1.0') {
    addError('document.schema_version', '$.schemaVersion', 'schemaVersion must be "1.0".');
  }
  const layoutKinds = schema.properties.kind.enum;
  if (!layoutKinds.includes(input.kind)) {
    addError('document.kind', '$.kind', `kind must be one of: ${layoutKinds.join(', ')}.`);
  }
  if (!isString(input.name, 255) || input.name.trim().length === 0) {
    addError('document.name', '$.name', 'name must be a non-empty string up to 255 characters.');
  }
  if (!Array.isArray(input.blocks)) {
    addError('document.blocks', '$.blocks', 'blocks must be an array.');
    return { valid: false, errors, warnings };
  }
  if (input.blocks.length < 1 || input.blocks.length > 100) {
    addError('document.block_count', '$.blocks', 'blocks must contain between 1 and 100 items.');
  }

  validateMetadata(input.metadata, addError);

  const blocksById = new Map();
  input.blocks.forEach((block, index) => {
    const path = `$.blocks[${index}]`;
    validateBlock(block, path, addError);
    if (!isObject(block) || !isString(block.id) || block.id.length === 0) return;
    if (blocksById.has(block.id)) {
      addError('block.duplicate_id', `${path}.id`, `Block ID "${block.id}" is duplicated.`, block.id);
    } else {
      blocksById.set(block.id, block);
    }
  });

  validateHierarchy(input.blocks, blocksById, addError);

  if (semantic) {
    validateSemantics(input, addError, warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateMetadata(metadata, addError) {
  if (metadata === undefined) return;
  if (!isObject(metadata)) {
    addError('metadata.type', '$.metadata', 'metadata must be an object.');
    return;
  }
  for (const key of ownKeysOnly(metadata, new Set(['description', 'designStyle', 'origin']))) {
    addError('metadata.unknown_property', `$.metadata.${key}`, `Unknown metadata property "${key}".`);
  }
  if (metadata.description !== undefined && !isString(metadata.description, 1000)) {
    addError('metadata.description', '$.metadata.description', 'description must be a string up to 1000 characters.');
  }
  if (metadata.designStyle !== undefined && !isString(metadata.designStyle, 100)) {
    addError('metadata.design_style', '$.metadata.designStyle', 'designStyle must be a string up to 100 characters.');
  }
  if (metadata.origin !== undefined && !['manual', 'ai', 'imported', 'migrated'].includes(metadata.origin)) {
    addError('metadata.origin', '$.metadata.origin', 'origin is not supported.');
  }
}

function validateBlock(block, path, addError) {
  if (!isObject(block)) {
    addError('block.type', path, 'Block must be an object.');
    return;
  }
  const blockId = isString(block.id) ? block.id : undefined;
  if (!isString(block.id, 100) || block.id.trim().length === 0) {
    addError('block.id', `${path}.id`, 'Block id must be a non-empty string up to 100 characters.', blockId);
  }
  if (!BLOCK_TYPES.includes(block.type)) {
    addError('block.unsupported_type', `${path}.type`, `Unsupported block type "${String(block.type)}".`, blockId);
    return;
  }

  for (const key of ownKeysOnly(block, BLOCK_KEYS[block.type])) {
    addError('block.unknown_property', `${path}.${key}`, `Property "${key}" is not allowed on ${block.type}.`, blockId);
  }
  if (!Object.hasOwn(block, 'content')) {
    addError('block.content_required', `${path}.content`, `${block.type} requires content.`, blockId);
  } else {
    validateContent(block, path, addError);
  }
  if (block.parentId !== undefined && (!isString(block.parentId, 100) || block.parentId.trim() === '')) {
    addError('block.parent_id', `${path}.parentId`, 'parentId must be a non-empty string up to 100 characters.', blockId);
  }
  validateStyles(block.styles, path, blockId, addError);
  validateBindings(block, path, blockId, addError);
  if (block.type === 'Heading' && block.level !== undefined && !isIntegerBetween(block.level, 1, 3)) {
    addError('block.heading_level', `${path}.level`, 'Heading level must be 1, 2, or 3.', blockId);
  }
}

function validateStyles(styles, path, blockId, addError) {
  if (styles === undefined) return;
  if (!isObject(styles)) {
    addError('block.styles_type', `${path}.styles`, 'styles must be an object.', blockId);
    return;
  }
  for (const [key, value] of Object.entries(styles)) {
    if (!STYLE_PROPERTIES.includes(key)) {
      addError('block.style_unsupported', `${path}.styles.${key}`, `Style property "${key}" is not allowed.`, blockId);
      continue;
    }
    if (!['string', 'number'].includes(typeof value)) {
      addError('block.style_value', `${path}.styles.${key}`, 'Style values must be strings or numbers.', blockId);
    }
    if (typeof value === 'string' && /(expression\s*\(|javascript:)/i.test(value)) {
      addError('block.style_unsafe', `${path}.styles.${key}`, 'Style value contains an unsafe expression.', blockId);
    }
  }
}

function validateBindings(block, path, blockId, addError) {
  if (block.bindings === undefined) return;
  if (!BINDABLE_TYPES.has(block.type)) {
    addError('block.bindings_unsupported', `${path}.bindings`, `${block.type} does not support bindings.`, blockId);
    return;
  }
  if (!isObject(block.bindings)) {
    addError('block.bindings_type', `${path}.bindings`, 'bindings must be an object.', blockId);
    return;
  }
  for (const key of ownKeysOnly(block.bindings, new Set(['content']))) {
    addError('block.binding_unknown', `${path}.bindings.${key}`, `Unknown binding target "${key}".`, blockId);
  }
  if (block.bindings.content !== undefined && !BINDING_PATHS.includes(block.bindings.content)) {
    addError('block.binding_path', `${path}.bindings.content`, `Binding path "${String(block.bindings.content)}" is not allowed.`, blockId);
  }
}

function validateContent(block, path, addError) {
  const value = block.content;
  const blockId = block.id;
  const fail = (message) => addError('block.content_shape', `${path}.content`, message, blockId);
  const exactObject = (candidate, required, optional = []) => {
    if (!isObject(candidate)) return false;
    if (required.some((key) => !Object.hasOwn(candidate, key))) return false;
    return ownKeysOnly(candidate, new Set([...required, ...optional])).length === 0;
  };

  switch (block.type) {
    case 'Heading':
      if (!(isString(value) || (exactObject(value, ['text'], ['level']) && isString(value.text) && (value.level === undefined || isIntegerBetween(value.level, 1, 3))))) {
        fail('Heading content must be a string or { text, level? }.');
      }
      break;
    case 'Paragraph':
      if (!(isString(value) || (exactObject(value, ['text']) && isString(value.text)))) fail('Paragraph content must be a string or { text }.');
      break;
    case 'Image':
      if (!(isString(value, 5000) || (exactObject(value, ['src'], ['alt']) && isString(value.src, 5000) && (value.alt === undefined || isString(value.alt, 1000))))) fail('Image content must be a URL string or { src, alt? }.');
      break;
    case 'Quote':
      if (!(isString(value) || (exactObject(value, ['text'], ['attribution']) && isString(value.text) && (value.attribution === undefined || isString(value.attribution))))) fail('Quote content must be a string or { text, attribution? }.');
      break;
    case 'Divider':
    case 'Container':
      if (value !== '') fail(`${block.type} content must be an empty string.`);
      break;
    case 'Button':
      if (!(exactObject(value, ['text', 'url']) && isString(value.text) && isSafeUrl(value.url))) fail('Button content must be { text, url } with a safe URL.');
      break;
    case 'Columns': {
      const columns = isObject(value) ? value.columns : value;
      if (!((Number.isInteger(value) || exactObject(value, ['columns'])) && isIntegerBetween(columns, 1, 4))) fail('Columns content must specify 1-4 columns.');
      break;
    }
    case 'Collection List':
      if (!(exactObject(value, ['limit', 'category']) && isIntegerBetween(value.limit, 1, 50) && isString(value.category, 100))) fail('Collection List content must be { limit: 1-50, category: string }.');
      break;
    case 'Featured Carousel':
      if (!(exactObject(value, ['limit']) && isIntegerBetween(value.limit, 1, 20))) fail('Featured Carousel content must be { limit: 1-20 }.');
      break;
    case 'Video': {
      const url = isObject(value) ? value.url : value;
      const shapeValid = isString(value) || (exactObject(value, ['url'], ['title']) && (value.title === undefined || isString(value.title)));
      if (!(shapeValid && isSafeUrl(url))) fail('Video content must contain a safe video URL.');
      break;
    }
    case 'Newsletter':
      if (!(exactObject(value, ['title', 'description', 'buttonText', 'placeholder']) && ['title', 'description', 'buttonText', 'placeholder'].every((key) => isString(value[key])))) fail('Newsletter content must contain title, description, buttonText, and placeholder strings.');
      break;
    case 'Social Links': {
      const linksValid = exactObject(value, ['links']) && Array.isArray(value.links) && value.links.length <= 20 && value.links.every((link) => exactObject(link, ['name', 'url']) && isString(link.name) && isSafeUrl(link.url));
      if (!linksValid) fail('Social Links content must be { links: [{ name, url }] } with safe URLs.');
      break;
    }
    case 'Spacer': {
      const height = isObject(value) ? value.height : value;
      const shapeValid = isString(value) || typeof value === 'number' || exactObject(value, ['height']);
      const valueValid = isString(height) || (typeof height === 'number' && height >= 0 && height <= 1000);
      if (!(shapeValid && valueValid)) fail('Spacer content must be a CSS height, number from 0-1000, or { height }.');
      break;
    }
    case 'Code Block':
      if (!(exactObject(value, ['code', 'language']) && isString(value.code, 100000) && isString(value.language, 50))) fail('Code Block content must be { code, language }.');
      break;
    case 'Html': {
      const html = isObject(value) ? value.html : value;
      const shapeValid = isString(value, 100000) || (exactObject(value, ['html']) && isString(value.html, 100000));
      if (!shapeValid) fail('Html content must be a string or { html }.');
      else if (/<script\b|\son\w+\s*=|javascript:/i.test(html)) addError('block.html_unsafe', `${path}.content`, 'Html content contains scripts, event handlers, or unsafe URLs.', blockId);
      break;
    }
    case 'Markdown':
      if (!(isString(value, 100000) || (exactObject(value, ['markdown']) && isString(value.markdown, 100000)))) fail('Markdown content must be a string or { markdown }.');
      break;
  }
}

function validateHierarchy(blocks, blocksById, addError) {
  blocks.forEach((block, index) => {
    if (!isObject(block) || !isString(block.id) || !isString(block.parentId)) return;
    const path = `$.blocks[${index}].parentId`;
    if (block.parentId === block.id) {
      addError('block.parent_self', path, 'A block cannot be its own parent.', block.id);
      return;
    }
    const parent = blocksById.get(block.parentId);
    if (!parent) {
      addError('block.parent_missing', path, `Parent block "${block.parentId}" does not exist.`, block.id);
      return;
    }
    if (!CONTAINER_TYPES.has(parent.type)) {
      addError('block.parent_type', path, `Parent block "${block.parentId}" must be a Container or Columns block.`, block.id);
    }

    const seen = new Set([block.id]);
    let current = block;
    let depth = 0;
    while (current?.parentId) {
      if (seen.has(current.parentId)) {
        addError('block.parent_cycle', path, `Block "${block.id}" is part of a parent cycle.`, block.id);
        break;
      }
      seen.add(current.parentId);
      current = blocksById.get(current.parentId);
      depth += 1;
      if (!current) break;
      if (depth > 8) {
        addError('block.nesting_depth', path, 'Layout nesting cannot exceed 8 levels.', block.id);
        break;
      }
    }
  });
}

function validateSemantics(document, addError, warnings) {
  if (document.kind === 'single-post') {
    const bindings = document.blocks
      .filter(isObject)
      .map((block) => block.bindings?.content)
      .filter(Boolean);
    if (!bindings.includes('post.title')) {
      addError('semantic.single_post_title', '$.blocks', 'Single Post layout requires a block bound to post.title.');
    }
    if (!bindings.includes('post.contentHtml')) {
      addError('semantic.single_post_content', '$.blocks', 'Single Post layout requires a block bound to post.contentHtml.');
    }
    if (!bindings.includes('post.coverImage') && !bindings.includes('post.featured_image')) {
      warnings.push({
        code: 'semantic.single_post_cover_optional',
        path: '$.blocks',
        message: 'Single Post layout has no dynamic cover-image binding.',
      });
    }
  }
  if (document.kind === 'blog-archive') {
    const hasCollection = document.blocks.some((block) => isObject(block) && block.type === 'Collection List');
    if (!hasCollection) {
      addError('semantic.blog_archive_collection', '$.blocks', 'Blog Archive layout requires at least one Collection List block.');
    }
  }
  if (document.kind === 'home-page') {
    const bindings = document.blocks
      .filter(isObject)
      .map((block) => block.bindings?.content)
      .filter(Boolean);
    if (!bindings.includes('site.name')) {
      addError('semantic.home_page_site_name', '$.blocks', 'Home Page layout requires a block bound to site.name.');
    }
    const hasCollection = document.blocks.some((block) => isObject(block) && block.type === 'Collection List');
    if (!hasCollection) {
      addError('semantic.home_page_collection', '$.blocks', 'Home Page layout requires at least one Collection List block for published posts.');
    }
    if (!bindings.includes('site.tagline') && !bindings.includes('site.description')) {
      warnings.push({
        code: 'semantic.home_page_description_optional',
        path: '$.blocks',
        message: 'Home Page layout has no dynamic site tagline or description binding.',
      });
    }
  }
}

function assertValidLayoutDocumentV1(input, options) {
  const result = validateLayoutDocumentV1(input, options);
  if (!result.valid) {
    const error = new Error(result.errors.map((item) => `${item.path}: ${item.message}`).join('\n'));
    error.name = 'LayoutValidationError';
    error.validationErrors = result.errors;
    throw error;
  }
  return result;
}

module.exports = {
  BLOCK_TYPES,
  BINDING_PATHS,
  STYLE_PROPERTIES,
  validateLayoutDocumentV1,
  assertValidLayoutDocumentV1,
};
