class DataAssistant {
  constructor() {
    this.currentData = null;
    this.currentSql = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTemperatureSlider();
  }

  setupEventListeners() {
    document.getElementById('uploadForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUpload();
    });

    document.getElementById('cleanupBtn').addEventListener('click', () => {
      this.handleCleanup();
    });

    document.getElementById('generateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGenerate();
    });

    document.getElementById('insertBtn').addEventListener('click', () => {
      this.handleQuickEdit();
    });

    document.getElementById('tableSelect').addEventListener('change', (e) => {
      this.handleTableSelect(e.target.value);
    });
  }

  setupTemperatureSlider() {
    const slider = document.getElementById('temperature');
    const value = document.getElementById('temperatureValue');
    
    slider.addEventListener('input', (e) => {
      value.textContent = e.target.value;
    });
  }

  async handleUpload() {
    const formData = new FormData(document.getElementById('uploadForm'));
    
    try {
      this.showLoading('uploadForm');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showMessage(result.message, 'success');
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('Upload failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('uploadForm');
    }
  }

  async handleCleanup() {
    try {
      this.showLoading('cleanupBtn');
      
      const response = await fetch('/api/cleanup', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showMessage(result.message, 'success');
        this.clearData();
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('Cleanup failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('cleanupBtn');
    }
  }

  async handleGenerate() {
    const prompt = document.getElementById('prompt').value;
    const temperature = document.getElementById('temperature').value;
    const maxTokens = document.getElementById('maxTokens').value;
    
    if (!prompt.trim()) {
      this.showMessage('Please enter a prompt', 'error');
      return;
    }
    
    try {
      this.showLoading('generateBtn');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          temperature: parseFloat(temperature),
          maxTokens: parseInt(maxTokens)
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.currentData = result.preview;
        this.currentSql = result.sql;
        this.displayData(result.preview);
        this.showMessage('Data generated successfully', 'success');
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('Generation failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('generateBtn');
    }
  }

  async handleQuickEdit() {
    const instructions = document.getElementById('quickEdit').value;
    
    if (!instructions.trim()) {
      this.showMessage('Please enter edit instructions', 'error');
      return;
    }
    
    if (!this.currentSql) {
      this.showMessage('No data to edit. Please generate data first.', 'error');
      return;
    }
    
    try {
      this.showLoading('insertBtn');
      
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: instructions,
          sql: this.currentSql,
          temperature: parseFloat(document.getElementById('temperature').value),
          maxTokens: parseInt(document.getElementById('maxTokens').value)
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.currentData = result.preview;
        this.currentSql = result.sql;
        this.displayData(result.preview);
        this.showMessage('Data updated successfully', 'success');
        document.getElementById('quickEdit').value = '';
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('Update failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('insertBtn');
    }
  }

  displayData(data) {
    const container = document.getElementById('tableContainer');
    const tableSelect = document.getElementById('tableSelect');
    const insertMessage = document.getElementById('insertMessage');
    const downloadLink = document.getElementById('downloadLink');
    
    container.innerHTML = '';
    tableSelect.innerHTML = '';
    insertMessage.innerHTML = '';
    downloadLink.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = '<p>No data to display</p>';
      return;
    }
    
    const tableNames = Object.keys(data);
    tableNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      tableSelect.appendChild(option);
    });
    
    if (tableNames.length > 0) {
      this.displayTable(data[tableNames[0]], tableNames[0]);
    }
    
    const totalRows = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);
    insertMessage.innerHTML = `<strong>Generated ${totalRows} rows across ${tableNames.length} tables</strong>`;
    
    if (this.currentSql) {
      downloadLink.innerHTML = `
        <button class="btn btn-secondary" onclick="dataAssistant.downloadData()">
          <span class="btn-icon">📥</span>Download CSV
        </button>
      `;
    }
    
    document.getElementById('insertBtn').disabled = false;
  }

  displayTable(data, tableName) {
    const container = document.getElementById('tableContainer');
    
    if (!data || data.length === 0) {
      container.innerHTML = '<p>No data in this table</p>';
      return;
    }
    
    const headers = Object.keys(data[0]);
    
    let html = `
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
  }

  handleTableSelect(tableName) {
    if (this.currentData && this.currentData[tableName]) {
      this.displayTable(this.currentData[tableName], tableName);
    }
  }

  async downloadData() {
    if (!this.currentSql) {
      this.showMessage('No data to download', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: this.currentSql,
          filename: 'generated_data.csv'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_data.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        this.showMessage(error.error, 'error');
      }
    } catch (error) {
      this.showMessage('Download failed: ' + error.message, 'error');
    }
  }

  clearData() {
    this.currentData = null;
    this.currentSql = null;
    document.getElementById('tableContainer').innerHTML = '';
    document.getElementById('tableSelect').innerHTML = '';
    document.getElementById('insertMessage').innerHTML = '';
    document.getElementById('downloadLink').innerHTML = '';
    document.getElementById('insertBtn').disabled = true;
  }

  showMessage(message, type) {
    const container = document.getElementById('responseMessage');
    const text = document.getElementById('responseText');
    
    text.textContent = message;
    text.className = type === 'success' ? 'hint response-success' : 'hint response-error';
    container.style.display = 'block';
    
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }

  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = true;
      element.innerHTML = '<span class="loading"></span> Loading...';
    }
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = false;
      if (elementId === 'generateBtn') {
        element.innerHTML = 'Generate';
      } else if (elementId === 'insertBtn') {
        element.innerHTML = '<span class="btn-icon">⚡</span>Submit';
      } else if (elementId === 'cleanupBtn') {
        element.innerHTML = '<span class="btn-icon">🗑️</span>Clean Up Schema';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dataAssistant = new DataAssistant();
});
