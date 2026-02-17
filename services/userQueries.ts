
import { User, UserRole } from '../types';

export const getCurrentUserProfile = async (): Promise<User> => {
  // Mocking database fetch
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'user-123',
        email: 'eleanor.vance@academy.edu',
        full_name: 'Eleanor Vance',
        role: UserRole.PRINCIPAL, // Testing with Principal role
        avatar_url: 'https://picsum.photos/seed/eleanor/200',
        workspace_id: 'ws-789'
      });
    }, 500);
  });
};
