const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const backendPath = path.resolve('backend');
console.log(`Backend path: ${backendPath}`);

const venvActivateCommand = os.platform() === 'win32'
  ? `cmd /c "cd \"${backendPath}\" && venv\\Scripts\\activate.bat"`
  : `source "${path.join(backendPath, 'venv', 'bin', 'activate')}"`;

const installDepsCommand = os.platform() === 'win32'
  ? `cmd /c "cd \"${backendPath}\" && venv\\Scripts\\activate.bat && venv\\Scripts\\pip install -r requirements.txt"`
  : `cd "${backendPath}" && source ./venv/bin/activate && pip install -r requirements.txt`;

const serverCommand = os.platform() === 'win32'
  ? `cmd /c "cd \"${backendPath}\" && venv\\Scripts\\activate.bat && uvicorn main:app --reload"`
  : `cd "${backendPath}" && source ./venv/bin/activate && ./venv/bin/uvicorn main:app --reload`;

console.log(`Dependency installation command: ${installDepsCommand}`);
console.log(`Server start command: ${serverCommand}`);

const installDepsProcess = spawn(installDepsCommand, {
  shell: true,
  stdio: 'inherit'
});

installDepsProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('Dependencies installed successfully.');
    const serverProcess = spawn(serverCommand, {
      cwd: backendPath,
      shell: true,
      stdio: 'inherit'
    });

    serverProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Server started successfully.');
      } else {
        console.error(`Server failed with exit code: ${code}`);
      }
    });
  } else {
    console.error(`Failed to install dependencies: ${code}`);
  }
});
