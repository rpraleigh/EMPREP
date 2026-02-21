import TemplateForm from '@/components/alerts/TemplateForm';

export default function NewTemplatePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Template</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Create a reusable alert template. Use {'{{variable}}'} for dynamic content.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TemplateForm />
      </div>
    </div>
  );
}
