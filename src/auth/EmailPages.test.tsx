import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import AuthPage from './AuthPage';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './EmailPages';

describe('account email pages', () => {
  it('confirms an address once', async () => {
    let calls = 0;
    stubApi({ 'POST /api/auth/verify-email': () => (calls++, { verified: true, email: 'ada@example.com' }) });
    renderApp(<VerifyEmailPage />, { path: '/verify-email?token=abc' });
    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it('explains a dead link', async () => {
    stubApi({ 'POST /api/auth/verify-email': () => new Response(JSON.stringify({ error: 'this link is invalid or has expired; ask for a new one' }), { status: 400 }) });
    renderApp(<VerifyEmailPage />, { path: '/verify-email?token=old' });
    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/);
  });

  it('asks for a reset link without revealing accounts', async () => {
    let sent = '';
    stubApi({ 'POST /api/auth/password/forgot': (init) => ((sent = JSON.parse(String(init?.body)).email), { message: 'If an account uses that address, a reset link is on its way.' }) });
    renderApp(<ForgotPasswordPage />, { path: '/forgot-password' });
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send the link/ }));
    expect(await screen.findByText(/a reset link is on its way/)).toBeInTheDocument();
    expect(sent).toBe('ada@example.com');
  });

  it('sets a new password', async () => {
    let body: Record<string, string> = {};
    stubApi({ 'POST /api/auth/password/reset': (init) => ((body = JSON.parse(String(init?.body))), { reset: true }) });
    renderApp(<ResetPasswordPage />, { path: '/reset-password?token=t1' });
    await userEvent.type(screen.getByLabelText(/New password/), 'brand new password');
    await userEvent.type(screen.getByLabelText('Again'), 'brand new passwrd');
    await userEvent.click(screen.getByRole('button', { name: /Change password/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The two passwords differ.');
    await userEvent.clear(screen.getByLabelText('Again'));
    await userEvent.type(screen.getByLabelText('Again'), 'brand new password');
    await userEvent.click(screen.getByRole('button', { name: /Change password/ }));
    expect(await screen.findByText('Your password is changed.')).toBeInTheDocument();
    expect(body).toEqual({ token: 't1', password: 'brand new password' });
  });

  it('offers "Forgot password?" only when email is on', async () => {
    stubApi({ 'GET /api/auth/me': () => new Response('{}', { status: 401 }), 'GET /api/auth/config': () => ({ signup_enabled: true, mail_enabled: true }) });
    renderApp(<AuthPage mode="login" />, { path: '/login' });
    expect(await screen.findByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });

  it('hides it when email is off', async () => {
    stubApi({ 'GET /api/auth/me': () => new Response('{}', { status: 401 }) });
    renderApp(<AuthPage mode="login" />, { path: '/login' });
    await screen.findByRole('button', { name: /Log in/ });
    await waitFor(() => expect(screen.queryByText('Forgot password?')).toBeNull());
  });
});
