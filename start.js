const { execSync } = require('child_process');
const net = require('net');

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function startApp() {
  const port = await findAvailablePort(3000);
  console.log(`Starting application on port ${port}`);
  try {
    execSync(`PORT=${port} yarn start:dev`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to start the application:', error);
  }
}

startApp();