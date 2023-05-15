import * as http from 'http';
import {v4 as uuidv4, validate} from 'uuid';
import {IWorker, User} from './models'
import * as dotenv from 'dotenv';
import * as os from "os";
dotenv.config();

const users: User[] = [];

let currentWorkerPort: number = parseInt(process.env.PORT, 10);

const numCPUs = os.cpus().length;

const workers: { [port: string]: { port: number; host: string } } = {};
for (let i = 0; i < numCPUs; i++) {
    const port = parseInt(process.env.PORT, 10) + i;
    workers[port.toString()] = { host: 'localhost', port: port };
}

function parseJson(body: string) {
    try {
        return JSON.parse(body);
    } catch (err) {
        return null;
    }
}

function sendResponse(
    res: http.ServerResponse,
    statusCode: number,
    data: any = null,
    contentType = 'application/json'
) {
    if (res.headersSent) {
        return;
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', contentType);
    if (data) {
        res.write(JSON.stringify(data));
    }
    res.end();
}

function getAllUsers(req: http.IncomingMessage, res: http.ServerResponse) {
    sendResponse(res, 200, users);
}

function getUserById(id: string, res: http.ServerResponse) {
    if (!id || !validate(id)) {
        return sendResponse(res, 400, {error: `Invalid user id ${id}`});
    }

    const user = users.find((u) => u.id === id);
    if (!user) {
        return sendResponse(res, 404, {error: 'User not found'});
    }

    sendResponse(res, 200, user);
}

function createUser(req: http.IncomingMessage, res: http.ServerResponse) {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const data = parseJson(body);
        if (!data || !data.username || !data.age) {
            return sendResponse(res, 400, {error: 'Missing required fields'});
        }

        const newUser = {
            id: uuidv4(),
            username: data.username,
            age: data.age,
            hobbies: data.hobbies || [],
        };
        users.push(newUser);

        sendResponse(res, 201, newUser);
    });
}

function getNextWorker(): IWorker {
    const worker = workers[currentWorkerPort];
    currentWorkerPort = currentWorkerPort === 4004 ? 4000 : currentWorkerPort + 1;
    return worker;
}

function proxyRequest(url: string, req: http.IncomingMessage, res: http.ServerResponse) {
    const { port } = getNextWorker();
    const options: http.RequestOptions = {
        method: req.method,
        headers: req.headers,
        host: 'localhost',
        port: port.toString(),
        path: req.url,
    };

    const workerReq = http.request(url, options,(workerRes) => {
        const chunks: Buffer[] = [];

        workerRes.on('data', (chunk) => {
            chunks.push(chunk);
        });

        workerRes.on('end', () => {
            const data = Buffer.concat(chunks);
            sendResponse(res, workerRes.statusCode || 500, data, workerRes.headers['content-type']);
        });
    });

    workerReq.on('error', (error) => {
        sendResponse(res, 500, { error: 'Internal server error' });
    });

    req.pipe(workerReq);
}

function updateUser(id: string, req: http.IncomingMessage, res: http.ServerResponse) {
    if (!id || !validate(id)) {
        return sendResponse(res, 400, {error: 'Invalid user id'});
    }

    const user = users.find((u) => u.id === id);
    if (!user) {
        return sendResponse(res, 404, {error: 'User not found'});
    }

    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const data = parseJson(body);
        if (!data || (!data.username && !data.age && !data.hobbies)) {
            return sendResponse(res, 400, {error: 'Missing required fields'});
        }

        if (data.username) {
            user.username = data.username;
        }
        if (data.age) {
            user.age = data.age;
        }
        if (data.hobbies) {
            user.hobbies = data.hobbies;
        }

        sendResponse(res, 200, user);
    });
}

function deleteUser(id: string, res: http.ServerResponse) {
    if (!id || !validate(id)) {
        return sendResponse(res, 400, {error: 'Invalid user id'});
    }

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        return sendResponse(res, 404, {error: 'User not found'});
    }

    const deletedUser = users.splice(index, 1)[0];
    sendResponse(res, 200, deletedUser);
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const {method} = req;

    if (method === 'GET' && req.url === '/api/users') {
        getAllUsers(req, res);
    } else if (method === 'GET' && req.url?.startsWith('/api/users/')) {
        const id = req.url.split('/')[3];
        if (!id || !validate(id)) {
            return sendResponse(res, 400, {error: `Invalid user id ${id}`});
        }
        getUserById(id, res);
    } else if (method === 'POST' && req.url === '/api/users') {
        createUser(req, res);
    } else if (method === 'PUT' && req.url?.startsWith('/api/users/')) {
        const id = req.url.split('/')[3];
        if (!id || !validate(id)) {
            return sendResponse(res, 400, {error: 'Invalid user id'});
        }
        updateUser(id, req, res);
    } else if (method === 'DELETE' && req.url?.startsWith('/api/users/')) {
        const id = req.url.split('/')[3];
        if (!id || !validate(id)) {
            return sendResponse(res, 400, {error: 'Invalid user id'});
        }
        deleteUser(id, res);
    } else {
        const { port } = getNextWorker();
        const url = `http://localhost:${port}${req.url}`;
        proxyRequest(url, req, res);
        sendResponse(res, 404, {error: 'Endpoint not found'});
    }
}

Object.values(workers).forEach((worker: IWorker) => {
    const server = http.createServer(handleRequest);

    server.listen(worker.port, () => {
        console.log(`Server running on port ${worker.port}`);
    });
});