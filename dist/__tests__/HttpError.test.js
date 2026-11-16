import { describe, it, expect } from 'vitest';
import { HttpError } from '../core/HttpError.js';
describe('HttpError', () => {
    it('should be an instance of Error and HttpError', () => {
        const error = new HttpError(500, 'Internal Server Error');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HttpError);
    });
    it('should correctly store status code and message', () => {
        const error = new HttpError(403, 'Forbidden');
        expect(error.status).toBe(403);
        expect(error.message).toBe('Forbidden');
        expect(error.name).toBe('HttpError');
    });
    it('should generate a default message if none is provided', () => {
        const error = new HttpError(502);
        expect(error.status).toBe(502);
        expect(error.message).toContain('502');
    });
});
