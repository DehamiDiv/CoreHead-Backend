// layoutValidator.js

/**
 * Validates the generated layout JSON structure to ensure any dynamic blocks 
 * (like blog loops) contain safe querying properties.
 */
const validateLayoutJson = (layoutJson) => {
    // If it's a string, try parsing it first
    let layout;
    if (typeof layoutJson === 'string') {
        try {
            layout = JSON.parse(layoutJson);
        } catch (e) {
            throw new Error("Invalid format: layoutJson must be a valid JSON object or string");
        }
    } else {
        layout = layoutJson;
    }

    // Usually layout has a root structure like { blocks: [...] } or is just an array
    const blocks = layout.blocks || (Array.isArray(layout) ? layout : []);

    // Recursive function to search for blog_loop blocks
    const checkBlocksRecursively = (blockList) => {
        if (!Array.isArray(blockList)) return;

        for (const block of blockList) {
            // Check blog loops (Handles both internal 'blog_loop' and frontend 'Collection List' names)
            if (block.type === 'blog_loop' || block.type === 'Collection List') {
                // Support both frontend 'content' and standard 'props.query' structures
                const query = block.props?.query || block.content;
                
                if (!query) {
                    throw new Error(`Validation Error: ${block.type} block is missing query/content properties`);
                }
                
                // Validate limit
                if (query.limit !== undefined) {
                    const limit = parseInt(query.limit);
                    if (isNaN(limit) || limit < 1 || limit > 50) {
                        throw new Error(`Validation Error: ${block.type} limit must be a number between 1 and 50`);
                    }
                }
            }

            // If the block contains nested blocks (like a container), validate them too
            if (block.children && Array.isArray(block.children)) {
                checkBlocksRecursively(block.children);
            }
        }
    };

    checkBlocksRecursively(blocks);
    return true; // No errors thrown, it's valid!
};

module.exports = {
    validateLayoutJson
};
