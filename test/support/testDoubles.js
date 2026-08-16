function createAiProviderMock(result) {
  const calls = [];
  return {
    calls,
    async generateLayout(prompt) {
      calls.push(prompt);
      return result;
    },
  };
}

function createPrismaMock(results = {}) {
  const calls = [];
  const models = new Proxy({}, {
    get(_target, model) {
      if (model === 'calls') return calls;
      return new Proxy({}, {
        get(_modelTarget, operation) {
          return async (args) => {
            calls.push({ model, operation, args });
            return results[model]?.[operation];
          };
        },
      });
    },
  });
  return models;
}

module.exports = { createAiProviderMock, createPrismaMock };
