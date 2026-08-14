import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size, color }) => {
  // Lucide exports icons as PascalCase
  const IconComponent = (Icons as any)[name] || (Icons as any)['Tag'] || Icons.CircleDollarSign;

  return (
    <IconComponent
      className={className}
      size={size}
      style={color ? { color } : undefined}
    />
  );
};
