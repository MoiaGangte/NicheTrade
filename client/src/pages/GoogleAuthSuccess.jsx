import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    if (token && name && email) {
      localStorage.setItem('token', token);
      setUser({ name, email });
      navigate('/'); // Redirect to home or wherever you want
    } else {
      navigate('/login');
    }
  }, [location, navigate, setUser]);

  return <div>Signing you in with Google...</div>;
};

export default GoogleAuthSuccess; 