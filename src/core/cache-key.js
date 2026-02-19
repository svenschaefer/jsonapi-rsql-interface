function createNormalizedQueryKey(normalizedQuery) {
  return JSON.stringify(normalizedQuery || {});
}

module.exports = {
  createNormalizedQueryKey
};
