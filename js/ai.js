// Chat interface component
class AIChat {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById("judge0-chat-form").addEventListener("submit", async (event) => {
            event.preventDefault();

            const userInput = document.getElementById("judge0-chat-user-input");
            const userInputValue = userInput.value.trim();
            if (userInputValue === "") {
                return;
            }

            const sendButton = document.getElementById("judge0-chat-send-button");
            const messages = document.getElementById("judge0-chat-messages");
            
            // Disable input and show loading state
            sendButton.classList.add("loading");
            userInput.disabled = true;

            // Display user message
            const userMessage = document.createElement("div");
            userMessage.innerText = userInputValue;
            userMessage.classList.add("ui", "message", "judge0-message", "judge0-user-message");
            if (!theme.isLight()) {
                userMessage.classList.add("inverted");
            }
            messages.appendChild(userMessage);

            // Clear input and scroll
            userInput.value = "";
            messages.scrollTop = messages.scrollHeight;

            // Create AI message placeholder
            const aiMessage = document.createElement("div");
            aiMessage.classList.add("ui", "basic", "segment", "judge0-message", "loading");
            if (!theme.isLight()) {
                aiMessage.classList.add("inverted");
            }
            messages.appendChild(aiMessage);
            messages.scrollTop = messages.scrollHeight;

            try {
                // Get current code context
                const currentCode = sourceEditor.getValue();
                
                // Create context-aware prompt
                const prompt = `Current code:\n${currentCode}\n\nUser message: ${userInputValue}`;
                
                // Use Puter AI API
                const aiResponse = await puter.ai.chat([{
                    role: "user",
                    content: prompt
                }], {
                    model: document.getElementById("judge0-chat-model-select").value,
                });

                // Process response
                let aiResponseValue = typeof aiResponse === "string" ? aiResponse : aiResponse.map(v => v.text).join("\n");
                
                // Display response with markdown formatting
                aiMessage.innerHTML = DOMPurify.sanitize(marked.parse(aiResponseValue));
                
                // Render any math expressions
                renderMathInElement(aiMessage, {
                    delimiters: [
                        { left: "\\(", right: "\\)", display: false },
                        { left: "\\[", right: "\\]", display: true }
                    ]
                });
            } catch (error) {
                console.error('Chat error:', error);
                aiMessage.innerText = "I encountered an error processing your request. Please try again.";
            } finally {
                // Reset UI state
                aiMessage.classList.remove("loading");
                messages.scrollTop = messages.scrollHeight;
                userInput.disabled = false;
                sendButton.classList.remove("loading");
                userInput.focus();
            }
        });
    }

    // Add keyboard shortcut for chat focus
    setupKeyboardShortcuts() {
        document.addEventListener("keydown", function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "p") {
                if (configuration.get("appOptions.showAIAssistant")) {
                    e.preventDefault();
                    document.getElementById("judge0-chat-user-input").focus();
                }
            }
        });
    }
}

// Initialize chat when document is ready
document.addEventListener("DOMContentLoaded", () => {
    const chat = new AIChat();
    chat.setupKeyboardShortcuts();
});