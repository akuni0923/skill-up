// src/components/StepIndicator.tsx

'use client';

const steps = [
  { num: 1, label: '음식 선택', icon: '🎲' },
  { num: 2, label: '스토리보드', icon: '📝' },
  { num: 3, label: '에셋 생성', icon: '🎨' },
  { num: 4, label: '편집', icon: '✏️' },
  { num: 5, label: '완성', icon: '🎬' },
];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${
                currentStep === step.num
                  ? 'bg-orange-500 text-white shadow-lg scale-105'
                  : currentStep > step.num
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
          >
            <span>{currentStep > step.num ? '✅' : step.icon}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 ${
                currentStep > step.num ? 'bg-green-300' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}