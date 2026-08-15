const templateRepo = require('../src/repositories/templateRepository');

async function main() {
  try {
    const templates = await templateRepo.getAllTemplates();
    console.log("Templates fetched:", templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}

main();
