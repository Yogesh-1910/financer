import React, { useState, useEffect, useRef } from 'react';
import { MdMic, MdSend, MdStopCircle } from 'react-icons/md';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './AIAssistant.module.css';
import { sendMessageToPhi2 } from '../../api/llmService';
import { speakText, startListening, stopListening } from '../../api/voiceService';

const AIAssistant = () => {
  const [messages, setMessages] = useState(() => {
      const savedMessages = sessionStorage.getItem('aiChatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [{ sender: 'ai', text: 'Hello! I am FinBot. How can I assist you with your finances today?' }];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input field

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    sessionStorage.setItem('aiChatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (textToSend) => {
    const currentMessage = textToSend || inputText;
    if (!currentMessage.trim()) return;

    const userMessage = { sender: 'user', text: currentMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    if (!textToSend) setInputText(''); // Clear input if not from voice direct send
    setIsLoading(true);
    setVoiceError('');

    const chatHistoryForLLM = messages
        .slice(-6) // Send last 6 messages for context (adjust as needed)
        .map(msg => ({
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.text
        }));
    // chatHistoryForLLM.push({ role: 'user', content: userMessage.text }); // Not needed as it's the current message

    try {
      const aiResponseText = await sendMessageToPhi2(userMessage.text, chatHistoryForLLM);
      const aiMessage = { sender: 'ai', text: aiResponseText };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      if (document.getElementById('speakAiResponse')?.checked) {
        speakText(aiResponseText);
      }
    } catch (error) { // This catch might be redundant if llmService handles errors well
      const errorMessage = { sender: 'ai', text: `Sorry, an error occurred: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus(); // Refocus input after sending
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    setVoiceError('');
    try {
      const transcript = await startListening();
      setInputText(transcript); // Put transcript in input box
      // Optionally auto-send:
      // if (transcript) handleSend(transcript);
    } catch (error) {
      console.error("Voice input error:", error);
      setVoiceError(error.message || "Voice input failed.");
      // setMessages(prev => [...prev, {sender: 'ai', text: `Voice input error: ${error.message}`}]);
    } finally {
        setIsListening(false);
        inputRef.current?.focus(); // Refocus input
    }
  };

  return (
    <Card title="AI Financial Assistant (FinBot)" className={styles.aiAssistantCard}>
      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.messageBubble} ${styles[msg.sender]}`}>
            <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>
          </div>
        ))}
        {isLoading && <div className={`${styles.messageBubble} ${styles.ai}`}><p><i>FinBot is thinking...</i></p></div>}
        <div ref={messagesEndRef} />
      </div>
      {voiceError && <p className={styles.voiceErrorMessage}>{voiceError}</p>}
      <div className={styles.inputArea}>
        <Input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask FinBot..."
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          name="ai-input"
          disabled={isLoading}
        />
        <Button 
          onClick={() => handleSend()} 
          disabled={isLoading || !inputText.trim()} 
          className={styles.sendButton} 
          title="Send Message"
          variant="primary" // Assuming green is primary
        >
          <MdSend /> {/* Using MdSend icon */}
        </Button>
        <Button 
          onClick={handleVoiceInput} 
          variant={isListening ? "danger" : "secondary"} // Red when listening, blue/grey otherwise
          className={styles.voiceButton} 
          title={isListening ? "Stop Listening" : "Use Voice Input"}
        >
          {isListening ? <MdStopCircle /> : <MdMic />} {/* Using MdMic or MdStopCircle icon */}
        </Button>
      </div>
      <div className={styles.chatOptions}>
        <label htmlFor="speakAiResponse">
            <input type="checkbox" id="speakAiResponse" name="speakAiResponse" />
            Speak AI Responses
        </label>
      </div>
      <p className={styles.llmNote}>
        FinBot connects to a local LLM (e.g., Phi-2 via LM Studio). Ensure it's running.
        For best results, ask financial questions.
      </p>
    </Card>
  );
};

export default AIAssistant;