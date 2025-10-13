import http from 'http';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApplication } from './shared-bot.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'POST' && req.url === '/api/application') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const applicationData = JSON.parse(body);
                console.log('📋 Получена заявка с сайта:', applicationData);
                
                const success = await handleApplication(applicationData);
                
                if (success) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'success', 
                        message: 'Application processed' 
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        message: 'Bot not initialized' 
                    }));
                }
                
            } catch (error) {
                console.error('❌ Ошибка обработки заявки с сайта:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    message: 'Invalid application data' 
                }));
            }
        });
    }
    else if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                
                const signature = req.headers['x-hub-signature-256'];
                if (SECRET && signature) {
                    console.log('🔐 Проверка подписи webhook...');
                }
                
                if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
                    console.log('🔄 Получен webhook для развертывания...');
                    console.log(`📝 Commit: ${payload.head_commit?.message || 'N/A'}`);
                    console.log(`👤 Author: ${payload.head_commit?.author?.name || 'N/A'}`);
                    
                    deploy();
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'success', 
                        message: 'Deployment started' 
                    }));
                } else {
                    console.log('⏭️ Пропускаем webhook (не main ветка)');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'ignored', 
                        message: 'Not main branch' 
                    }));
                }
            } catch (error) {
                console.error('❌ Ошибка обработки webhook:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    message: 'Invalid payload' 
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: 'Not found' 
        }));
    }
});

function deploy() {
    console.log('🚀 Запуск автоматического развертывания...');
    
    const deployScript = path.join(__dirname, 'webhook-deploy.sh');
    
    exec(`bash ${deployScript}`, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Ошибка развертывания:', error);
            return;
        }
        
        if (stdout) {
            console.log('📤 Вывод развертывания:', stdout);
        }
        
        if (stderr) {
            console.error('⚠️ Предупреждения:', stderr);
        }
        
        console.log('✅ Развертывание завершено');
    });
}

server.listen(PORT, () => {
    console.log(`🌐 Webhook сервер запущен на порту ${PORT}`);
    console.log(`📡 URL для GitHub webhook: http://localhost:${PORT}/webhook`);
    console.log(`📋 URL для заявок с сайта: http://localhost:${PORT}/api/application`);
    console.log(`🔐 Секретный ключ: ${SECRET}`);
    console.log('💡 Настройте webhook в GitHub/GitLab на этот URL');
    console.log('🌐 Настройте отправку заявок с сайта на /api/application');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Остановка webhook сервера...');
    server.close(() => {
        console.log('✅ Webhook сервер остановлен');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен SIGTERM, остановка webhook сервера...');
    server.close(() => {
        console.log('✅ Webhook сервер остановлен');
        process.exit(0);
    });
});
