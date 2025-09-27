class DataAssistant {
  constructor() {
    this.currentData = null;
    this.currentSql = null;
    this.init();
  }

  init() {
    console.log('DataAssistant initializing...');
    this.setupEventListeners();
    this.setupTemperatureSlider();
    console.log('DataAssistant initialized successfully');
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // File input change event
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      console.log('File input found, adding event listener');
      fileInput.addEventListener('change', (e) => {
        console.log('File input changed:', e.target.files);
        if (e.target.files.length > 0) {
          this.handleUpload();
        }
      });
    } else {
      console.error('File input not found!');
    }

    const cleanupBtn = document.getElementById('cleanupBtn');
    if (cleanupBtn) {
      cleanupBtn.addEventListener('click', () => {
        this.handleCleanup();
      });
    }

    const generateForm = document.getElementById('generateForm');
    if (generateForm) {
      generateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGenerate();
      });
    }

    const insertBtn = document.getElementById('insertBtn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        this.handleQuickEdit();
      });
    }

    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
      tableSelect.addEventListener('change', (e) => {
        this.handleTableSelect(e.target.value);
      });
    }
    
    console.log('Event listeners setup complete');
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
      console.log('Starting upload...');
      this.showLoading('uploadForm');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload result:', result);
      
      if (response.ok) {
        console.log('Upload successful, showing message:', result.message);
        this.showMessage(result.message, 'success');
        // Clear the file input safely
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        console.log('Upload failed, showing error:', result.error);
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      console.log('Upload error:', error);
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
        const quickEdit = document.getElementById('quickEdit');
        if (quickEdit) {
          quickEdit.value = '';
        }
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
    
    console.log('🔍 displayData called with:', data);
    console.log('🔍 data type:', Array.isArray(data) ? 'array' : typeof data);
    
    if (!data || (Array.isArray(data) && data.length === 0) || (!Array.isArray(data) && Object.keys(data).length === 0)) {
      container.innerHTML = '<p>No data to display</p>';
      return;
    }
    
    // Handle array data (from our mock AI)
    if (Array.isArray(data)) {
      console.log('📊 Handling array data with', data.length, 'items');
      
      // Create a single table option for the array
      const option = document.createElement('option');
      option.value = 'employees';
      option.textContent = 'Employees';
      tableSelect.appendChild(option);
      
      // Display the array as a table
      this.displayTable(data, 'employees');
      
      insertMessage.innerHTML = `<strong>Generated ${data.length} employee records</strong>`;
    } else {
      // Handle object data (original format)
      console.log('📊 Handling object data');
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
    }
    
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
    console.log('showMessage called with:', message, type);
    const container = document.getElementById('responseMessage');
    const text = document.getElementById('responseText');
    
    if (!container || !text) {
      console.error('Response message elements not found!');
      return;
    }
    
    text.textContent = message;
    text.className = type === 'success' ? 'hint response-success' : 'hint response-error';
    container.style.display = 'block';
    
    console.log('Message displayed:', message);
    
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }

  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      if (elementId === 'uploadForm') {
        // For upload form, show loading on the file input label
        const label = element.querySelector('label');
        if (label) {
          label.innerHTML = '<span class="loading"></span> Uploading...';
          label.style.pointerEvents = 'none';
        }
      } else {
        element.disabled = true;
        element.innerHTML = '<span class="loading"></span> Loading...';
      }
    }
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      if (elementId === 'uploadForm') {
        // For upload form, restore the label
        const label = element.querySelector('label');
        if (label) {
          label.innerHTML = '<span class="btn-icon">⬆️</span>Upload DDL Schema';
          label.style.pointerEvents = 'auto';
        }
      } else {
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.dataAssistant = new DataAssistant();
});
