// src/components/FoodGenerator.tsx

'use client';

import { useProjectStore } from '@/store/useProjectStore';

export function FoodGenerator() {
  const { project, generateFoodName, isLoading } = useProjectStore();

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          어떤 요리를 만들까요?
        </h2>
        <p className="text-gray-500 mb-6">
          버튼을 누르면 AI가 랜덤으로 맛있는 요리를 추천해줘요!
        </p>

        {/* 생성된 음식 이름 */}
        {project && (
          <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
            <div className="text-4xl mb-2">🍽️</div>
            <h3 className="text-2xl font-bold text-orange-600">{project.foodName}</h3>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
        )}

        {/* 생성 버튼 */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={generateFoodName}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 
                       hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl 
                       text-lg font-semibold shadow-lg hover:shadow-xl transition-all 
                       transform hover:scale-105 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                생성 중...
              </span>
            ) : project ? (
              '🎲 다시 뽑기'
            ) : (
              '🎲 랜덤 음식 뽑기!'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}