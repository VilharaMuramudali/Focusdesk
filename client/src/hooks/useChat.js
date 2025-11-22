import { useChat as useChatContext } from '../context/ChatContext.jsx';
import { useCallback } from 'react';

export const useChat = () => {
  const chatContext = useChatContext();

  const sendTextMessage = useCallback(async (conversationId, content) => {
    return await chatContext.sendMessage(conversationId, content, 'text');
  }, [chatContext]);

  const sendFileMessage = useCallback(async (conversationId, file) => {
    const messageType = file.type.startsWith('image/') ? 'image' : 'file';
    return await chatContext.sendMessage(conversationId, file.name, messageType, file);
  }, [chatContext]);

  const startTyping = useCallback((conversationId) => {
    chatContext.startTyping(conversationId);
  }, [chatContext]);

  const stopTyping = useCallback((conversationId) => {
    chatContext.stopTyping(conversationId);
  }, [chatContext]);

  const markAsRead = useCallback(async (conversationId) => {
    return await chatContext.markMessagesAsRead(conversationId);
  }, [chatContext]);

  const createNewConversation = useCallback(async (participantId, participantName, receiverType = null, bookingId = null) => {
    return await chatContext.createConversation(participantId, participantName, receiverType, bookingId);
  }, [chatContext]);

  return {
    ...chatContext,
    sendTextMessage,
    sendFileMessage,
    startTyping,
    stopTyping,
    markAsRead,
    createNewConversation
  };
};
