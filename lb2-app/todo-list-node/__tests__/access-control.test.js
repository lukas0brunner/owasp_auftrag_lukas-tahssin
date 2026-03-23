const request = require('supertest');

const app = require('../app');
const { ensureRole } = require('../fw/security');

describe('Access control regression', () => {
  test('GET /admin/users redirects to /login when unauthenticated (integration)', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('ensureRole("admin") returns 403 for non-admin', () => {
    const mw = ensureRole('admin');
    const req = { session: { user: { role: 'user' } } };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(body) {
        this.body = body;
        return this;
      },
      redirect() {
        throw new Error('should not redirect in this case');
      }
    };
    const next = jest.fn();

    mw(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toBe('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  test('ensureRole("admin") calls next() for admin', () => {
    const mw = ensureRole('admin');
    const req = { session: { user: { role: 'admin' } } };
    const res = {
      status() {
        throw new Error('should not send status for admin');
      },
      send() {
        throw new Error('should not send for admin');
      },
      redirect() {
        throw new Error('should not redirect for admin');
      }
    };
    const next = jest.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
