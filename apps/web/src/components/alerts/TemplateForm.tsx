'use client';

import { useTransition, useState } from 'react';
import type { AlertTemplate } from '@rpral/types';
import type { AlertSeverity, AlertChannel, AlertLocale } from '@rpral/types';
import { upsertAlertTemplate } from '@/lib/alert-actions';

interface Props {
  template?: AlertTemplate;
}

export default function TemplateForm({ template }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await upsertAlertTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name" name="name" type="text" required
            defaultValue={template?.name}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select id="locale" name="locale" defaultValue={template?.locale ?? 'en'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(['en', 'es'] as AlertLocale[]).map((l) => (
              <option key={l} value={l}>{l === 'en' ? 'English' : 'Spanish'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select id="severity" name="severity" defaultValue={template?.severity ?? 'warning'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(['info', 'warning', 'critical'] as AlertSeverity[]).map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
            Default Channel
          </label>
          <select id="channel" name="channel" defaultValue={template?.channel ?? 'both'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(['push', 'sms', 'both'] as AlertChannel[]).map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject / Push Title <span className="text-red-500">*</span>
        </label>
        <input id="subject" name="subject" type="text" required
          defaultValue={template?.subject}
          placeholder="e.g. EVACUATION ORDER – {{zone}}"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Use {'{{variable}}'} for dynamic values.</p>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Message Body <span className="text-red-500">*</span>
        </label>
        <textarea id="body" name="body" rows={4} required
          defaultValue={template?.body}
          placeholder="Alert message body with {{variables}}…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {isPending ? 'Saving…' : template ? 'Update Template' : 'Create Template'}
      </button>
    </form>
  );
}
