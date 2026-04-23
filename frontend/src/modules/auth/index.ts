// Module Auth — Membre A
// Ré-export des composants/pages existants + API dédiée

export { LoginPage } from '../../pages/LoginPage';
export { RegisterPage } from '../../pages/RegisterPage';
export { AuthProvider, useAuth } from '../../context/AuthContext';
export { authApi } from './api';
