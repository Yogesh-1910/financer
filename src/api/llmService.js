const LLM_API_ENDPOINT = 'http://localhost:1234/v1/chat/completions'; // Common for LM Studio (OpenAI compatible)

export const sendMessageToPhi2 = async (message, chatHistory = []) => {
  console.log("Sending to LLM:", message);
  console.log("With history:", chatHistory);

  const messagesPayload = [
    { role: "system", content: "You are FinBot, a helpful and concise financial assistant. Provide clear and actionable financial advice. If asked about non-financial topics, politely state you are a financial assistant and steer back to finance." },
    ...chatHistory,
    { role: "user", content: message }
  ];

  try {
    const response = await fetch(LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "phi-2", // This might not be needed if your server defaults or is model-specific
        messages: messagesPayload,
        max_tokens: 200,
        temperature: 0.7,
        // stream: false, // Set true for streaming, requires different handling
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LLM API Error Response:', errorData);
      throw new Error(`LLM API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else if (data.error) { // Handle error structure if present in JSON response
        console.error("LLM API returned an error object:", data.error);
        return `LLM Error: ${data.error.message || 'Unknown error from LLM.'}`;
    } else {
      console.error("Unexpected LLM response structure:", data);
      return "Sorry, I received an unexpected response from the AI. (Check console)";
    }

  } catch (error) {
    console.error('Error communicating with LLM:', error);
    if (error.message.includes('Failed to fetch')) {
        return "Error: Could not connect to the AI assistant. Is the local LLM server (e.g., LM Studio) running and the API endpoint correct?";
    }
    return `Error: ${error.message}`;
  }
};