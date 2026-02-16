'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Task } from '@/types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  task,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Task" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-error-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-error-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-medium">
              Are you sure you want to delete this task?
            </p>
            {task && (
              <p className="mt-1.5 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                &ldquo;{task.title}&rdquo;
              </p>
            )}
            <p className="mt-2 text-sm text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
