'use client';

import React from 'react';
import { AdminVideoForm } from './AdminVideoForm';
import { VideoItem } from '@/lib/types';

interface UploadContentDashboardProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onSuccessRedirect?: (videoId: string) => void;
  isModal?: boolean;
}

export function UploadContentDashboard({
  onCancel,
  onSuccess,
  onSuccessRedirect,
}: UploadContentDashboardProps) {
  const handleSuccess = (video: VideoItem) => {
    if (onSuccessRedirect) {
      onSuccessRedirect(video.id);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="w-full py-2">
      <AdminVideoForm
        onSuccess={handleSuccess}
        onCancel={onCancel}
      />
    </div>
  );
}
