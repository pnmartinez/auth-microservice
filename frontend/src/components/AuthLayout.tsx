import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <p className="eyebrow">Auto Microservice</p>
        <h1 style={{ marginBottom: subtitle ? 8 : 24 }}>{title}</h1>
        {subtitle && (
          <p className="stat-sub" style={{ marginBottom: 24 }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

