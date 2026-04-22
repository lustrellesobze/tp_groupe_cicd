import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginPage } from '../../../pages/LoginPage';

describe('Module Auth — LoginPage', () => {
  it('affiche le titre de connexion', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  });
});
