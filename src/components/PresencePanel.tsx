import React from 'react';
import { PresenceData } from '@/lib/types';

interface PresencePanelProps {
  users: PresenceData[];
  currentUserId: string;
}

const PresencePanel: React.FC<PresencePanelProps> = ({ users, currentUserId }) => {
  const otherUsers = users.filter((u) => u.odId !== currentUserId);

  if (otherUsers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Only you are viewing
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">
        {otherUsers.length} collaborator{otherUsers.length !== 1 ? 's' : ''}:
      </span>
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map((user) => (
          <div
            key={user.odId}
            className="presence-avatar border-2 border-card"
            style={{ backgroundColor: user.color }}
            title={user.displayName}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        ))}
        {otherUsers.length > 5 && (
          <div className="presence-avatar bg-muted text-muted-foreground border-2 border-card">
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresencePanel;
