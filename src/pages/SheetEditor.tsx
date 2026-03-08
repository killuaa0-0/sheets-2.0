import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SheetData, CellData, Document, PresenceData, WriteStatus } from '@/lib/types';
import {
  subscribeToSheetData,
  updateCell,
  getDocument,
  subscribeToPresence,
  joinDocument,
  updatePresence,
  leaveDocument,
} from '@/lib/realtimeSync';
import SpreadsheetGrid from '@/components/SpreadsheetGrid';
import PresencePanel from '@/components/PresencePanel';
import WriteIndicator from '@/components/WriteIndicator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';

const SheetEditor: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [sheetData, setSheetData] = useState<SheetData>({});
  const [presence, setPresence] = useState<PresenceData[]>([]);
  const [writeStatus, setWriteStatus] = useState<WriteStatus>('idle');
  const [loading, setLoading] = useState(true);

  const presenceIntervalRef = useRef<NodeJS.Timeout>();
  const savedTimeoutRef = useRef<NodeJS.Timeout>();

  // Load document
  useEffect(() => {
    if (!docId) return;

    const loadDocument = async () => {
      const doc = await getDocument(docId);
      if (doc) {
        setDocument(doc);
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    };

    loadDocument();
  }, [docId, navigate]);

  // Subscribe to sheet data
  useEffect(() => {
    if (!docId) return;

    const unsubscribe = subscribeToSheetData(docId, setSheetData);
    return unsubscribe;
  }, [docId]);

  // Subscribe to presence
  useEffect(() => {
    if (!docId) return;

    const unsubscribe = subscribeToPresence(docId, setPresence);
    return unsubscribe;
  }, [docId]);

  // Join document and maintain presence
  useEffect(() => {
    if (!docId || !user) return;

    // Join immediately
    joinDocument(docId, user);

    // Update presence every 15 seconds
    presenceIntervalRef.current = setInterval(() => {
      updatePresence(docId, user.id);
    }, 15000);

    // Leave on unmount or tab close
    const handleBeforeUnload = () => {
      leaveDocument(docId, user.id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceIntervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveDocument(docId, user.id);
    };
  }, [docId, user]);

  const handleCellUpdate = useCallback(
    async (cellId: string, data: CellData) => {
      if (!docId) return;

      setWriteStatus('saving');

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      try {
        await updateCell(docId, cellId, data);
        setWriteStatus('saved');

        savedTimeoutRef.current = setTimeout(() => {
          setWriteStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Failed to update cell:', error);
        setWriteStatus('error');
      }
    },
    [docId]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card flex-shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">{document.title}</h1>
            </div>
            <WriteIndicator status={writeStatus} />
          </div>
          <div className="flex items-center gap-4">
            <PresencePanel users={presence} currentUserId={user?.id || ''} />
            {user && (
              <div
                className="presence-avatar text-sm"
                style={{ backgroundColor: user.color }}
                title={user.displayName}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spreadsheet */}
      <SpreadsheetGrid sheetData={sheetData} onCellUpdate={handleCellUpdate} />
    </div>
  );
};

export default SheetEditor;
