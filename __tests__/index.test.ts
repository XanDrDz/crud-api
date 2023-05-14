import { server as app } from "../src";
import { describe, expect, test } from '@jest/globals';
import * as supertest from 'supertest';
import * as dotenv from 'dotenv';

dotenv.config();



describe('API tests', () => {
    let createdRecordId;

    test('GET /api/users returns an empty array', async () => {
        const response = await supertest(app).get('/api/users');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('POST /api/users creates a new object', async () => {
        const response = await supertest(app).post('/api/users').send({
            "username": "Aleksandr",
            "age": "46",
            "hobbies": ["books","music"]
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.username).toBe('Aleksandr');
        expect(response.body.age).toBe('46');
        createdRecordId = response.body.id;
    });

    test('GET /api/users/:id returns the created record', async () => {
        const response = await supertest(app).get(`/api/users/${createdRecordId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(createdRecordId);
        expect(response.body.username).toBe('Aleksandr');
        expect(response.body.age).toBe('46');
    });

    test('PUT /api/users/:id updates the created record', async () => {
        const response = await supertest(app).put(`/api/users/${createdRecordId}`).send({
            username: 'Aleksandr',
            age: '13',
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(createdRecordId);
        expect(response.body.username).toBe('Aleksandr');
        expect(response.body.age).toBe('13');
    });

    test('DELETE /api/users/:id deletes the created record', async () => {
        const response = await supertest(app).delete(`/api/users/${createdRecordId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(createdRecordId);
    });

    test('GET /api/users/:id returns 404 for the deleted record', async () => {
        const response = await supertest(app).get(`/api/users/${createdRecordId}`);
        expect(response.statusCode).toBe(404);
    });

    afterAll((done) => {
        app.close(done);
    });
});