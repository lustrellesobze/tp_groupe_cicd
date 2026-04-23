import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginPage } from '../../../pages/LoginPage';
import { AuthProvider } from '../../../context/AuthContext';

describe('Module Auth — LoginPage', () => {
  it('affiche le titre de connexion', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>,
    );
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  });
});
