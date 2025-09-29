import React from 'react';

export interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

export interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export interface BulkActionButtonProps {
  children: React.ReactNode;
  count: number;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

export interface RefreshButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}
