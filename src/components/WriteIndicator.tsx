import React from 'react';
import { WriteStatus } from '@/lib/types';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface WriteIndicatorProps {
  status: WriteStatus;
}

const WriteIndicator: React.FC<WriteIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-status-saving" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-status-saved" />
          <span className="text-muted-foreground">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-destructive">Error saving</span>
        </>
      )}
    </div>
  );
};

export default WriteIndicator;
