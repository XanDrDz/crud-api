import * as http from 'http';
import {v4 as uuidv4, validate} from 'uuid';
import {User} from './models'
import * as dotenv from 'dotenv';
dotenv.config();

const users: User[] = [];

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
    console.log(id)
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
        sendResponse(res, 404, {error: 'Endpoint not found'});
    }
}

const server = http.createServer(handleRequest);

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});