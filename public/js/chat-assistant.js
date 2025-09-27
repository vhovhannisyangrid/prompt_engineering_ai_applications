class ChatAssistant {
  constructor() {
    this.conversationId = this.generateConversationId();
    this.currentData = null;
    this.currentSql = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupChatInput();
  }

  setupEventListeners() {
    document.getElementById('chatSend').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  setupChatInput() {
    const textarea = document.getElementById('chatInput');
    
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }

  generateConversationId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    input.style.height = 'auto';
    
    this.addMessage(message, 'user');
    
    this.showLoading();
    
    try {
      const response = await fetch('/api/chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: this.conversationId,
          message,
          sql: this.currentSql,
          rows: this.currentData
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.handleResponse(result);
      } else {
        this.addMessage('Error: ' + result.error, 'assistant');
      }
    } catch (error) {
      this.addMessage('Error: ' + error.message, 'assistant');
    } finally {
      this.hideLoading();
    }
  }

  handleResponse(response) {
    if (response.sql) {
      this.currentSql = response.sql;
      this.addMessage(`Generated SQL: \`${response.sql}\``, 'assistant');
    }
    
    if (response.rows && response.rows.length > 0) {
      this.currentData = response.rows;
      this.addMessage(`Found ${response.rows.length} rows of data`, 'assistant');
      this.displayData(response.rows);
    }
    
    if (response.chart) {
      this.displayChart(response.chart);
    }
  }

  addMessage(content, sender) {
    const chatLog = document.getElementById('chatLog');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Format content (basic markdown support)
    const formattedContent = this.formatMessage(content);
    messageDiv.innerHTML = formattedContent;
    
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  formatMessage(content) {
    return content
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  displayData(data) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    
    let tableHtml = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.slice(0, 10).map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    if (data.length > 10) {
      tableHtml += `<p><em>Showing first 10 of ${data.length} rows</em></p>`;
    }
    
    this.addMessage(tableHtml, 'assistant');
  }

  displayChart(chartConfig) {
    const chartHtml = `
      <div class="chart-container">
        <canvas id="chart_${Date.now()}"></canvas>
      </div>
    `;
    
    this.addMessage(chartHtml, 'assistant');
    
    setTimeout(() => {
      const canvas = document.querySelector(`#chart_${Date.now()}`);
      if (canvas && window.Chart) {
        new Chart(canvas, chartConfig);
      }
    }, 100);
  }

  showLoading() {
    const chatLog = document.getElementById('chatLog');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message assistant';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = '<span class="loading"></span> Thinking...';
    chatLog.appendChild(loadingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.chatAssistant = new ChatAssistant();
});
