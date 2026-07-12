import { cn } from '../../lib/utils';

interface Props {
  licenseExpiry: string;
}

export default function LicenseExpiryBadge({ licenseExpiry }: Props) {
  const today = new Date();
  const expiry = new Date(licenseExpiry);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const expired = diffDays < 0;
  const expiringSoon = !expired && diffDays <= 30;

  const label = expired
    ? `Expired ${Math.abs(diffDays)}d ago`
    : expiringSoon
    ? `Expires in ${diffDays}d`
    : expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        expired
          ? 'bg-red-100 text-red-800'
          : expiringSoon
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800',
      )}
      title={licenseExpiry}
    >
      {label}
    </span>
  );
}
