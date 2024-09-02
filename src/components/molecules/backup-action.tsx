'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { BsDatabaseFillCheck } from "react-icons/bs";
import { FaDownload } from "react-icons/fa";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FaCalculator } from "react-icons/fa";


const BackupAction = () => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>('/peacock_backup.json');

  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup',{
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        setDownloadLink(result.file);
        toast.success("Data backup done successfully, download now.");
      } else {
        toast.error('Failed to create backup: ' + result.error);
      }
    } catch (error) {
        toast.error('An error occurred while creating the backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturns = async () => {
    setCalculating(true);
    try {
      const response = await fetch('/api/returns',{
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Returns are recalculated successfully.");
      } else {
        toast.error('Failed to recalculated returns: ' + result.error);
      }
    } catch (error) {
        toast.error('An error occurred while recalculated returns.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <>
      <Button variant={'menu'} onClick={handleReturns} disabled={loading}>
        <FaCalculator className="h-5 w-5" /> {calculating ? 'Recalculated ...' : 'Recalculated Returns'}
      </Button>
      <Button variant={'menu'} onClick={handleBackup} disabled={loading}>
         <BsDatabaseFillCheck className="h-5 w-5" /> {loading ? 'Backing up...' : 'Backup Data'}
      </Button>
      {downloadLink && (
        <a href={downloadLink} 
            download="peacock_backup.json"
            className={cn('h-9 px-4 py-2 inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 no-touch:hover:bg-accent no-touch:hover:text-accent-foreground justify-start gap-4 text-foreground/80 w-full')}
          >
            <FaDownload className="h-5 w-5" /> 
            Download Backup
        </a>
      )}
    </>
  );
};

export default BackupAction;
