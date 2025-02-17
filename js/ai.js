"use strict";

// Constants for API configuration
const API_CONFIG = {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7
};

// Chat interface component
class AIChat {
    constructor() {
        this.chatContainer = document.getElementById('judge0-chat-container');
        this.messagesList = document.getElementById('judge0-chat-messages');
        this.inputField = document.getElementById('judge0-chat-user-input');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Debounced input handler for better performance
        let timeout;
        this.inputField.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.handleInput(), 300);
        });

        // Form submission
        document.getElementById('judge0-chat-form').addEventListener('submit', 
            async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            }
        );
    }

    async handleInput() {
        // Implement real-time suggestions
        const input = this.inputField.value.trim();
        if (input.length > 10) {
            try {
                const suggestions = await this.getAISuggestions(input);
                this.showSuggestions(suggestions);
            } catch (err) {
                console.error('Error getting suggestions:', err);
            }
        }
    }

    async handleSubmit() {
        const input = this.inputField.value.trim();
        if (!input) return;

        this.addMessage('user', input);
        this.inputField.value = '';

        try {
            const response = await this.getAIResponse(input);
            this.addMessage('assistant', response);
        } catch (err) {
            this.addMessage('error', 'Sorry, there was an error processing your request.');
            console.error('Chat error:', err);
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        messageDiv.innerHTML = marked.parse(content);
        this.messagesList.appendChild(messageDiv);
        this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }

    async getAIResponse(prompt) {
        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${configuration.get('aiApiKey')}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: API_CONFIG.maxTokens,
                temperature: API_CONFIG.temperature
            })
        });

        if (!response.ok) {
            throw new Error('AI response failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// Code analysis and error handling
class CodeAnalyzer {
    constructor(editor) {
        this.editor = editor;
        this.setupAnalysis();
    }

    setupAnalysis() {
        // Real-time code analysis
        this.editor.onDidChangeModelContent(() => {
            clearTimeout(this.analysisTimeout);
            this.analysisTimeout = setTimeout(() => this.analyzeCode(), 1000);
        });
    }

    async analyzeCode() {
        const code = this.editor.getValue();
        try {
            const analysis = await this.getCodeAnalysis(code);
            this.showAnalysisResults(analysis);
        } catch (err) {
            console.error('Analysis error:', err);
        }
    }

    async getCodeAnalysis(code) {
        const prompt = `Analyze this code for potential issues:\n${code}`;
        return await aiChat.getAIResponse(prompt);
    }

    showAnalysisResults(analysis) {
        // Update UI with analysis results
        const resultsContainer = document.getElementById('analysis-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = marked.parse(analysis);
        }
    }

    async handleCompilationError(error) {
        const fix = await this.getSuggestedFix(error);
        aiChat.addMessage('assistant', `Compilation Error Fix Suggestion:\n${fix}`);
    }

    async getSuggestedFix(error) {
        const prompt = `Fix this compilation error:\n${error}`;
        return await aiChat.getAIResponse(prompt);
    }
}

// Inline code chat feature
class InlineCodeChat {
    constructor(editor) {
        this.editor = editor;
        this.setupInlineChat();
    }

    setupInlineChat() {
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_C, 
            () => this.handleInlineChat()
        );
    }

    async handleInlineChat() {
        const selection = this.editor.getSelection();
        const code = this.editor.getModel().getValueInRange(selection);
        
        if (!code) return;

        const response = await aiChat.getAIResponse(
            `Explain this code:\n${code}`
        );
        
        this.showInlineChatResponse(response, selection);
    }

    showInlineChatResponse(response, selection) {
        // Create inline widget
        const widget = document.createElement('div');
        widget.className = 'inline-chat-widget';
        widget.innerHTML = marked.parse(response);
        
        // Position widget near selection
        const position = this.editor.getScrolledVisiblePosition(selection.getEndPosition());
        widget.style.top = `${position.top}px`;
        widget.style.left = `${position.left}px`;
        
        document.getElementById('editor-container').appendChild(widget);
    }
}

// Initialize components
let aiChat, codeAnalyzer, inlineChat;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco Editor
    require(['vs/editor/editor.main'], function() {
        const editor = monaco.editor.create(document.getElementById('editor'), {
            value: '// Start coding here...',
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true
        });

        // Initialize components
        aiChat = new AIChat();
        codeAnalyzer = new CodeAnalyzer(editor);
        inlineChat = new InlineCodeChat(editor);

        // Add AI autocomplete provider
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: async function(model, position) {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                try {
                    const suggestions = await aiChat.getAIResponse(
                        `Suggest completions for:\n${textUntilPosition}`
                    );
                    
                    return {
                        suggestions: suggestions.split('\n').map(suggestion => ({
                            label: suggestion,
                            kind: monaco.languages.CompletionItemKind.Text,
                            insertText: suggestion
                        }))
                    };
                } catch (err) {
                    console.error('Autocomplete error:', err);
                    return { suggestions: [] };
                }
            }
        });
    });
});

// Export needed functions and classes
export {
    AIChat,
    CodeAnalyzer,
    InlineCodeChat
};