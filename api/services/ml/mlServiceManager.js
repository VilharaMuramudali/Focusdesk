// ML Service Manager
// Automatically manages the Python ML recommendation service

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLServiceManager {
  constructor() {
    this.pythonProcess = null;
    this.isRunning = false;
    this.serviceUrl = process.env.ML_API_URL || process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.retryCount = 0;
    this.maxRetries = 5;
    this.healthCheckInterval = null;
    this.trainingInterval = null;
    
    // ML service paths - try multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../../..', 'education-recommender-ml'), // From api/services/ml/
      path.join(process.cwd(), 'education-recommender-ml'), // From project root
      path.join(__dirname, '../../../education-recommender-ml'), // Alternative
    ];
    
    // Find the first existing ML directory
    this.mlDir = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, 'ml_api_service.py'))) {
        this.mlDir = possiblePath;
        break;
      }
    }
    
    if (!this.mlDir) {
      // Use the first possible path as default
      this.mlDir = possiblePaths[0];
    }
    
    this.pythonScript = path.join(this.mlDir, 'ml_api_service.py');
    this.pythonExe = this.findPythonExecutable();
  }

  findPythonExecutable() {
    // Try common Python executable names
    const pythonNames = ['python3', 'python', 'py'];
    
    for (const name of pythonNames) {
      try {
        execSync(`${name} --version`, { stdio: 'ignore' });
        console.log(`✅ Found Python executable: ${name}`);
        return name;
      } catch (e) {
        // Try next
      }
    }
    
    // Fallback
    console.warn('⚠️ Could not find Python executable, using fallback: python');
    return 'python';
  }

  async checkDependencies() {
    try {
      // Check if requirements.txt exists
      const requirementsPath = path.join(this.mlDir, 'requirements.txt');
      if (!fs.existsSync(requirementsPath)) {
        console.warn('⚠️ requirements.txt not found in ML directory');
        return false;
      }

      // Try to import key Python packages (this will fail if not installed)
      // We can't directly check Python packages, but we can check if Python works
      try {
        execSync(`${this.pythonExe} -c "import pandas, sklearn, flask"`, { stdio: 'ignore' });
        return true;
      } catch (e) {
        console.warn('⚠️ Python dependencies may not be installed. Installing...');
        // Attempt to install dependencies
        try {
          execSync(`${this.pythonExe} -m pip install -r ${requirementsPath}`, { 
            stdio: 'inherit',
            cwd: this.mlDir,
            timeout: 60000 // 60 second timeout
          });
          console.log('✅ Python dependencies installed successfully');
          return true;
        } catch (installError) {
          console.error('❌ Failed to install Python dependencies:', installError.message);
          console.warn('⚠️ Please manually install dependencies: cd education-recommender-ml && pip install -r requirements.txt');
          return false;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check Python dependencies:', error.message);
      return false; // Continue anyway, may still work
    }
  }

  async startService() {
    if (this.isRunning) {
      console.log('✅ ML service is already running');
      return true;
    }

    try {
      console.log('🚀 Starting ML Recommendation Service...');
      
      // Check if ML service directory exists
      if (!fs.existsSync(this.mlDir)) {
        console.warn('⚠️ ML service directory not found:', this.mlDir);
        console.warn('⚠️ ML service will not be available. System will use fallback recommendations.');
        return false;
      }

      // Check if Python script exists
      if (!fs.existsSync(this.pythonScript)) {
        console.warn('⚠️ ML API service script not found:', this.pythonScript);
        console.warn('⚠️ ML service will not be available. System will use fallback recommendations.');
        return false;
      }

      // Check and install dependencies if needed
      await this.checkDependencies();

      // Change to ML directory and start Python service
      const scriptPath = path.join(this.mlDir, 'ml_api_service.py');
      const workingDir = this.mlDir;

      // Start Python process
      console.log(`📝 Starting Python service: ${this.pythonExe} ${scriptPath}`);
      console.log(`📁 Working directory: ${workingDir}`);
      
      this.pythonProcess = spawn(this.pythonExe, [scriptPath], {
        cwd: workingDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/',
          DB_NAME: process.env.DB_NAME || 'focusdesk',
          ML_API_PORT: process.env.ML_API_PORT || '5000'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false
      });

      // Handle stdout
      this.pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[ML Service]:', output.trim());
        
        // Check if service started successfully
        if (output.includes('Server starting') || output.includes('port 5000')) {
          console.log('✅ ML service is starting...');
        }
      });

      // Handle stderr
      this.pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('[ML Service Error]:', error.trim());
      });

      // Handle process exit
      this.pythonProcess.on('exit', (code) => {
        console.log(`[ML Service] Process exited with code ${code}`);
        this.isRunning = false;
        this.pythonProcess = null;
        
        // Auto-restart if unexpected exit
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Attempting to restart ML service (attempt ${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.startService(), 5000);
        }
      });

      // Wait for service to be ready (with longer timeout for first start)
      try {
        await this.waitForService(60000); // 60 second timeout for initial start
        
        this.isRunning = true;
        this.retryCount = 0;
        
        // Start health check monitoring
        this.startHealthCheck();
        
        console.log('✅ ML service started successfully!');
        return true;
      } catch (waitError) {
        console.error('❌ ML service did not become ready in time:', waitError.message);
        console.warn('⚠️ System will use fallback recommendations.');
        
        // Kill the process if it didn't start properly
        if (this.pythonProcess) {
          this.pythonProcess.kill();
          this.pythonProcess = null;
        }
        
        this.isRunning = false;
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to start ML service:', error.message);
      this.isRunning = false;
      if (this.pythonProcess) {
        this.pythonProcess.kill();
        this.pythonProcess = null;
      }
      return false;
    }
  }

  async waitForService(maxWaitTime = 30000) {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`${this.serviceUrl}/health`, { 
          timeout: 2000 
        });
        if (response.data.status === 'healthy') {
          return true;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error('ML service did not become ready in time');
  }

  startHealthCheck() {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${this.serviceUrl}/health`, { 
          timeout: 5000 
        });
        
        if (response.data.status === 'healthy') {
          this.isRunning = true;
        } else {
          this.isRunning = false;
        }
      } catch (error) {
        console.warn('⚠️ ML service health check failed:', error.message);
        this.isRunning = false;
        
        // Attempt to restart if service is down
        if (!this.pythonProcess || this.pythonProcess.killed) {
          console.log('🔄 ML service appears to be down, attempting restart...');
          this.startService();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async stopService() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }

    if (this.pythonProcess) {
      console.log('🛑 Stopping ML service...');
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
      this.isRunning = false;
    }
  }

  async extractAndTrainModel() {
    try {
      console.log('📊 Starting automatic data extraction and model training...');
      
      const response = await axios.post(`${this.serviceUrl}/extract-and-train`, {}, {
        timeout: 300000 // 5 minutes timeout for training
      });

      if (response.data.success) {
        console.log('✅ Model training completed successfully');
        return true;
      } else {
        console.error('❌ Model training failed:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during model training:', error.message);
      return false;
    }
  }

  async checkModelStatus() {
    try {
      const response = await axios.get(`${this.serviceUrl}/stats`, {
        timeout: 5000
      });
      
      return {
        modelsLoaded: response.data.models_loaded || false,
        modelExists: response.data.model_exists || false,
        usersCount: response.data.users_count || 0,
        packagesCount: response.data.packages_count || 0
      };
    } catch (error) {
      return {
        modelsLoaded: false,
        modelExists: false,
        error: error.message
      };
    }
  }

  async initializeModel() {
    // Check if model exists, if not, train it
    try {
      const stats = await this.checkModelStatus();
      
      if (!stats.modelsLoaded || !stats.modelExists) {
        console.log('📚 No trained model found. Starting initial training...');
        await this.extractAndTrainModel();
      } else {
        console.log('✅ ML model is already trained');
      }
    } catch (error) {
      console.warn('⚠️ Could not check model status, will attempt training on next interval:', error.message);
      // Attempt training anyway
      setTimeout(() => this.extractAndTrainModel(), 10000);
    }
  }

  startAutomaticTraining(intervalHours = 24) {
    // Clear existing interval if any
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
    }

    // Convert hours to milliseconds
    const intervalMs = intervalHours * 60 * 60 * 1000;

    console.log(`🔄 Automatic model training scheduled every ${intervalHours} hours`);

    // Initial training check after service starts (wait 60 seconds for service to fully initialize)
    setTimeout(async () => {
      console.log('📚 Checking ML model status and initializing if needed...');
      await this.initializeModel();
    }, 60000); // Wait 60 seconds for service to be fully ready

    // Set up periodic training
    this.trainingInterval = setInterval(async () => {
      console.log('🔄 Starting scheduled model training...');
      await this.extractAndTrainModel();
    }, intervalMs);
  }

  async getRecommendations(userId, options = {}) {
    if (!this.isRunning) {
      throw new Error('ML service is not running');
    }

    try {
      const response = await axios.post(`${this.serviceUrl}/recommendations`, {
        user_id: userId.toString(),
        algorithm: options.algorithm || 'hybrid',
        limit: options.limit || 10,
        query: options.query || ''
      }, {
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      throw new Error(`ML service error: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new MLServiceManager();

