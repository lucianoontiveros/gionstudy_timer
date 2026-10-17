export const rememberChatMessage = (seenIds, messageId, maxSize = 2000) => {
  if (typeof messageId !== "string" || !messageId) return false;
  if (seenIds.has(messageId)) return true;

  seenIds.add(messageId);
  if (seenIds.size > maxSize) {
    const oldestMessageId = seenIds.values().next().value;
    seenIds.delete(oldestMessageId);
  }
  return false;
};
