// components/Chat/MessageComposer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaSmile, FaImage } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext.jsx';
import { useNotifications } from '../../hooks/useNotifications';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import './MessageComposer.scss';

const MessageComposer = ({ conversationId, onSendMessage }) => {
  const { startTyping, stopTyping, isConnected } = useChat();
  const { showFileUploadNotification, showErrorNotification } = useNotifications();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.message-composer')) {
        setShowEmojiPicker(false);
        setShowFileUpload(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.length > 0 && !isTyping && isConnected) {
      setIsTyping(true);
      startTyping(conversationId);
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }

    // Clear typing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.length > 0 && isConnected) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(conversationId);
      }, 2000);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageContent = message.trim();
    setIsSending(true);
    
    try {
      await onSendMessage(messageContent, 'text');
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Stop typing
      setIsTyping(false);
      stopTyping(conversationId);
      
      // Hide emoji picker
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition + emoji.length;
      }
    }, 0);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      setIsSending(true);
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      const displayMessage = messageType === 'image' 
        ? `📷 Shared an image: ${file.name}`
        : `📎 Shared a file: ${file.name}`;
      
      await onSendMessage(displayMessage, messageType, file);
      setShowFileUpload(false);
      showFileUploadNotification(file.name, true);
    } catch (error) {
      console.error('Error uploading file:', error);
      showFileUploadNotification(file.name, false);
      showErrorNotification('Failed to upload file');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (file) => {
    await handleFileUpload(file);
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowFileUpload(false);
  };

  return (
    <div className="message-composer">
      <div className="composer-toolbar">
        <button 
          className="toolbar-btn"
          onClick={toggleFileUpload}
          title="Attach file"
          disabled={isSending || !isConnected}
        >
          <FaPaperclip />
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={toggleFileUpload}
          title="Send image"
          disabled={isSending || !isConnected}
        >
          <FaImage />
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={toggleEmojiPicker}
          title="Add emoji"
          disabled={isSending}
        >
          <FaSmile />
        </button>
      </div>

      <div className="composer-input">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={
            !isConnected 
              ? "Connecting..." 
              : isSending 
                ? "Sending..." 
                : "Type a message..."
          }
          rows="1"
          maxLength="1000"
          disabled={isSending || !isConnected}
        />
        
        <button 
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending || !isConnected}
          title="Send message"
        >
          <FaPaperPlane />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      {showFileUpload && (
        <div className="file-upload-container">
          <FileUpload 
            onFileUpload={handleFileUpload}
            onImageUpload={handleImageUpload}
            onClose={() => setShowFileUpload(false)}
            isUploading={isSending}
          />
        </div>
      )}

      {!isConnected && (
        <div className="connection-status">
          <span>⚠️ Disconnected - Trying to reconnect...</span>
        </div>
      )}
    </div>
  );
};

export default MessageComposer;
