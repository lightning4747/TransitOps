import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export default function RoleGuard({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const toastedRef = useRef(false);

  const hasAccess = !roles || (user && roles.includes(user.role));

  useEffect(() => {
    if (isAuthenticated && !hasAccess && !toastedRef.current) {
      toastedRef.current = true;
      toast.error("You don't have permission to view that page.");
    }
  }, [isAuthenticated, hasAccess]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
