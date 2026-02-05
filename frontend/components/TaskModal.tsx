'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Task, ModalMode } from '@/types';
import { createTaskSchema, CreateTaskFormData } from '@/lib/validations';

interface TaskModalProps {
  isOpen: boolean;
  mode: ModalMode;
  task?: Task | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function TaskModal({
  isOpen,
  mode,
  task,
  onClose,
  onSubmit,
  isLoading,
  error,
}: TaskModalProps) {
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && task) {
        reset({
          title: task.title,
          description: task.description || '',
        });
      } else {
        reset({
          title: '',
          description: '',
        });
      }
    }
  }, [isOpen, isEdit, task, reset]);

  const handleFormSubmit = async (data: CreateTaskFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <Input
          label="Title"
          placeholder="Enter task title"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Description */}
        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Enter task description"
            className={`block w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 resize-none ${
              errors.description
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20'
            }`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error-600">
              {errors.description.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">Max 1000 characters</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
