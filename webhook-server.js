const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key'; // Замените на свой секретный ключ

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                
                // Проверяем секретный ключ (если настроен)
                const signature = req.headers['x-hub-signature-256'];
                if (SECRET && signature) {
                    // Здесь можно добавить проверку подписи GitHub
                    console.log('🔐 Проверка подписи webhook...');
                }
                
                // Проверяем, что это push в main ветку
                if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
                    console.log('🔄 Получен webhook для развертывания...');
                    console.log(`📝 Commit: ${payload.head_commit?.message || 'N/A'}`);
                    console.log(`👤 Author: ${payload.head_commit?.author?.name || 'N/A'}`);
                    
                    // Запускаем развертывание
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
    console.log(`📡 URL для webhook: http://localhost:${PORT}/webhook`);
    console.log(`🔐 Секретный ключ: ${SECRET}`);
    console.log('💡 Настройте webhook в GitHub/GitLab на этот URL');
});

// Graceful shutdown
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
