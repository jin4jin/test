let API_KEY = localStorage.getItem('openai_api_key') || '';
let messageHistory = JSON.parse(localStorage.getItem('chat_history')) || [];

// 페이지 로드 시 API 키와 채팅 내역 확인
document.addEventListener('DOMContentLoaded', function() {
    if (API_KEY) {
        document.getElementById('apiKeyContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        // 저장된 채팅 내역 표시
        messageHistory.forEach(msg => {
            appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
        });
    }
});

async function validateApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey.startsWith('sk-')) {
        showError('유효하지 않은 API 키 형식입니다.');
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: "test"
                }]
            })
        });

        if (response.ok) {
            API_KEY = apiKey;
            localStorage.setItem('openai_api_key', apiKey);
            document.getElementById('apiKeyContainer').style.display = 'none';
            document.getElementById('chatContainer').style.display = 'block';
        } else {
            showError('유효하지 않은 API 키입니다.');
        }
    } catch (error) {
        showError('API 키 확인 중 오류가 발생했습니다.');
    }
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.getElementById('apiKeyContainer').appendChild(errorDiv);
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();

    if (message === '') return;

    appendMessage('user', message);
    userInput.value = '';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    ...messageHistory,
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // 메시지 히스토리 업데이트
        messageHistory.push(
            { role: "user", content: message },
            { role: "assistant", content: aiResponse }
        );
        
        // 로컬 스토리지에 대화 내역 저장
        localStorage.setItem('chat_history', JSON.stringify(messageHistory));
        
        appendMessage('ai', aiResponse);
    } catch (error) {
        console.error('Error:', error);
        appendMessage('ai', '죄송합니다. 오류가 발생했습니다.');
    }
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('apiKeyInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        validateApiKey();
    }
});

// 채팅 초기화 기능 추가
function clearChat() {
    messageHistory = [];
    localStorage.removeItem('chat_history');
    document.getElementById('chatBox').innerHTML = '';
}