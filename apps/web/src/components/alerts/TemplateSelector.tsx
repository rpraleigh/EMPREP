'use client';

import type { AlertTemplate } from '@rpral/types';

interface TemplateSelectorProps {
  templates: AlertTemplate[];
  onSelect: (template: AlertTemplate | null) => void;
}

export default function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const found = templates.find((t) => t.id === id) ?? null;
    onSelect(found);
  }

  return (
    <div>
      <label htmlFor="template_id" className="block text-sm font-medium text-gray-700 mb-1">
        Template <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <select
        id="template_id"
        name="template_id"
        onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">— None (manual entry) —</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.locale.toUpperCase()}) — {t.severity}
          </option>
        ))}
      </select>
    </div>
  );
}
