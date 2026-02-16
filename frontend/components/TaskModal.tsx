'use client';

import { useEffect, useState, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChip } from '@/components/ui/TagChip';
import { Task, ModalMode, PriorityLevel, RecurrencePattern } from '@/types';
import { createTaskSchema, CreateTaskFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  mode: ModalMode;
  task?: Task | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const priorities: { value: PriorityLevel; label: string; color: string; icon: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-success-100 text-success-700 border-success-200', icon: 'M19 9l-7 7-7-7' },
  { value: 'medium', label: 'Medium', color: 'bg-warning-100 text-warning-700 border-warning-200', icon: 'M5 12h14' },
  { value: 'high', label: 'High', color: 'bg-error-100 text-error-700 border-error-200', icon: 'M5 15l7-7 7 7' },
];

const recurrenceOptions: { value: RecurrencePattern; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

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
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      dueDate: '',
      isRecurring: false,
      recurrencePattern: null,
      recurrenceInterval: 1,
    },
  });

  const currentPriority = watch('priority');
  const currentTags = watch('tags') || [];
  const isRecurring = watch('isRecurring');

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      setTagInput('');
      if (isEdit && task) {
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'medium',
          tags: task.tags || [],
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          isRecurring: task.isRecurring || false,
          recurrencePattern: task.recurrencePattern || null,
          recurrenceInterval: task.recurrenceInterval || 1,
        });
      } else {
        reset({
          title: '',
          description: '',
          priority: 'medium',
          tags: [],
          dueDate: '',
          isRecurring: false,
          recurrencePattern: null,
          recurrenceInterval: 1,
        });
      }
    }
  }, [isOpen, isEdit, task, reset]);

  const handleFormSubmit = async (data: CreateTaskFormData) => {
    await onSubmit(data);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !currentTags.includes(tag) && currentTags.length < 10) {
      setValue('tags', [...currentTags, tag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', currentTags.filter((t) => t !== tag));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Description */}
        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Description
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={2}
            placeholder="Add more details about this task..."
            className={`block w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
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
        </div>

        {/* Priority & Due Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority
            </label>
            <div className="flex gap-1.5">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue('priority', p.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200',
                    currentPriority === p.value
                      ? `${p.color} ring-2 ring-offset-1 ring-primary-500`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  )}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={p.icon} />
                  </svg>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Due Date
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="date"
              id="dueDate"
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20"
              {...register('dueDate')}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tags
            <span className="text-gray-400 font-normal ml-1">(max 10)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Enter"
              maxLength={30}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || currentTags.length >= 10}
            >
              Add
            </Button>
          </div>
          {currentTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {currentTags.map((tag) => (
                <TagChip key={tag} tag={tag} size="md" onRemove={() => handleRemoveTag(tag)} />
              ))}
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="border border-gray-200 rounded-xl p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => {
                setValue('isRecurring', e.target.checked);
                if (!e.target.checked) {
                  setValue('recurrencePattern', null);
                  setValue('recurrenceInterval', 1);
                } else {
                  setValue('recurrencePattern', 'daily');
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Recurring Task</span>
          </label>

          {isRecurring && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-gray-500">Every</span>
              <input
                type="number"
                min={1}
                max={365}
                className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20"
                {...register('recurrenceInterval', { valueAsNumber: true })}
              />
              <div className="flex gap-1">
                {recurrenceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('recurrencePattern', opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200',
                      watch('recurrencePattern') === opt.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isEdit ? (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Task
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
