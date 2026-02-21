'use client';

import { useState, useTransition } from 'react';
import type { AlertTemplate } from '@rpral/types';
import type { AlertSeverity, AlertChannel } from '@rpral/types';
import { createAndDispatchAlert } from '@/lib/alert-actions';
import TemplateSelector from './TemplateSelector';

interface AlertFormProps {
  templates: AlertTemplate[];
}

export default function AlertForm({ templates }: AlertFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [bodyEs, setBodyEs]   = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('warning');
  const [channel, setChannel]   = useState<AlertChannel>('both');
  const [targetArea, setTargetArea] = useState('');
  const [templateId, setTemplateId] = useState('');

  function applyTemplate(template: AlertTemplate | null) {
    if (!template) {
      setTemplateId('');
      return;
    }
    setTemplateId(template.id);
    setTitle(template.subject);
    setBody(template.body);
    setSeverity(template.severity);
    setChannel(template.channel);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      try {
        await createAndDispatchAlert(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Dispatch failed');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Hidden fields for controlled values */}
      <input type="hidden" name="template_id" value={templateId} />
      <input type="hidden" name="severity"    value={severity} />
      <input type="hidden" name="channel"     value={channel} />

      <TemplateSelector templates={templates} onSelect={applyTemplate} />

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title" name="title" type="text" required
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. EVACUATION ORDER – Zone A"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Body (EN) */}
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Message (English) <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body" name="body" rows={3} required
          value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Alert message body…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Body (ES) */}
      <div>
        <label htmlFor="body_es" className="block text-sm font-medium text-gray-700 mb-1">
          Message (Spanish) <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="body_es" name="body_es" rows={3}
          value={bodyEs} onChange={(e) => setBodyEs(e.target.value)}
          placeholder="Mensaje en español…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <div className="flex gap-2">
            {(['info', 'warning', 'critical'] as AlertSeverity[]).map((s) => (
              <button
                key={s} type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                  severity === s
                    ? s === 'critical' ? 'bg-red-600 border-red-600 text-white'
                    : s === 'warning'  ? 'bg-amber-500 border-amber-500 text-white'
                    :                    'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <div className="flex gap-2">
            {(['push', 'sms', 'both'] as AlertChannel[]).map((c) => (
              <button
                key={c} type="button"
                onClick={() => setChannel(c)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                  channel === c
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target area */}
      <div>
        <label htmlFor="target_area" className="block text-sm font-medium text-gray-700 mb-1">
          Target Area <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="target_area" name="target_area" type="text"
          value={targetArea} onChange={(e) => setTargetArea(e.target.value)}
          placeholder="e.g. Zone A, Downtown, Eastside"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={isPending}
        className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Dispatching…' : '🚨 Dispatch Alert'}
      </button>
    </form>
  );
}
