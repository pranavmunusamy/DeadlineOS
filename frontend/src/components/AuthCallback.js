import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';

const AuthCallback = () => {
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      login(token);
      window.location.href = '/';
    } else if (error) {
      window.location.href = '/login?error=' + error;
    } else {
      window.location.href = '/login';
    }
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
