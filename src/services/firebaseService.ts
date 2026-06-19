// Mock User for Local Simulation without Google Cloud
export type User = { uid: string; displayName: string; email: string; photoURL: string };

let currentUser: User | null = null;
const AUTH_EVENT = 'mock_auth_changed';

export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  const checkAuth = () => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      if (onAuthSuccess) onAuthSuccess(currentUser!);
    } else {
      currentUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  };

  // Initial Check
  checkAuth();

  // Listen to cross-app-state logins
  window.addEventListener(AUTH_EVENT, checkAuth);
  
  return () => {
    window.removeEventListener(AUTH_EVENT, checkAuth);
  };
};

/**
 * Performs mock Sign In for standard Vercel simulation
 */
export const googleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    const mockUser: User = {
      uid: 'user_123',
      displayName: 'Admin User',
      email: 'admin@tournament.local',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event(AUTH_EVENT));
    return { user: mockUser };
  } catch (error: any) {
    console.warn('Mock Sign-In Error:', error);
    throw error;
  }
};

/**
 * Mocks logout
 */
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('mock_user');
  window.dispatchEvent(new Event(AUTH_EVENT));
};
