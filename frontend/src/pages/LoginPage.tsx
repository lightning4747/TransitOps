import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bus, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { login as apiLogin } from '../api/auth';
import { mockUsers } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

// Mock credentials for demo
const MOCK_CREDENTIALS: Record<string, string> = {
  'fleet@transitops.com': 'fleet123',
  'driver@transitops.com': 'driver123',
  'safety@transitops.com': 'safety123',
  'finance@transitops.com': 'finance123',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      if (USE_MOCK) {
        const validPassword = MOCK_CREDENTIALS[data.email];
        if (!validPassword || validPassword !== data.password) {
          toast.error('Invalid email or password');
          return;
        }
        const user = mockUsers.find((u) => u.email === data.email);
        if (!user) {
          toast.error('User not found');
          return;
        }
        login(user, 'mock-jwt-token');
        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard');
        return;
      }

      const response = await apiLogin(data.email, data.password);
      login(response.user, response.token);
      toast.success(`Welcome, ${response.user.name}!`);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">TransitOps</h1>
            <p className="text-sm text-slate-400">Smart Transport Operations Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="you@company.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo hint */}
          {USE_MOCK ? (
            <div className="mt-6 rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold text-slate-600">Demo accounts (Mock mode):</p>
              <ul className="space-y-0.5 text-xs text-slate-500">
                <li>fleet@transitops.com / fleet123</li>
                <li>driver@transitops.com / driver123</li>
                <li>safety@transitops.com / safety123</li>
                <li>finance@transitops.com / finance123</li>
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold text-slate-600">Demo accounts (Database mode):</p>
              <ul className="space-y-0.5 text-xs text-slate-500">
                <li>fleet@transitops.dev / password123 (Fleet Manager)</li>
                <li>driver@transitops.dev / password123 (Driver)</li>
                <li>safety@transitops.dev / password123 (Safety Officer)</li>
                <li>analyst@transitops.dev / password123 (Financial Analyst)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
