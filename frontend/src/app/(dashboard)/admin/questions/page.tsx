'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../../components/layout/ProtectedRoute';
import { questionApi, Question, Category } from '../../../../services/api/questionApi';
import { ErrorMessage, SuccessMessage } from '../../../../components/common';
import { getErrorMessage } from '../../../../utils/errorHandler';

interface QuestionFormData {
  categoryId: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  questionText: string;
  explanation: string;
  points: number;
  options: Array<{
    text: string;
    order: number;
    isCorrect: boolean;
  }>;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    categoryId: 0,
    difficulty: 'MEDIUM',
    questionText: '',
    explanation: '',
    points: 10,
    options: [
      { text: '', order: 1, isCorrect: false },
      { text: '', order: 2, isCorrect: false },
      { text: '', order: 3, isCorrect: false },
      { text: '', order: 4, isCorrect: false },
    ],
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, questionsData] = await Promise.all([
        questionApi.getCategories(),
        selectedCategory
          ? questionApi.getQuestionsByCategory(selectedCategory)
          : Promise.all(
              (await questionApi.getCategories()).map((cat) =>
                questionApi.getQuestionsByCategory(cat.id)
              )
            ).then((results) => results.flat()),
      ]);
      setCategories(categoriesData);
      setQuestions(questionsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formData.questionText.trim()) {
      setError('متن سوال الزامی است');
      return;
    }

    if (formData.options.filter((o) => o.text.trim()).length < 2) {
      setError('حداقل 2 گزینه باید پر شود');
      return;
    }

    const correctOptions = formData.options.filter((o) => o.isCorrect && o.text.trim());
    if (correctOptions.length === 0) {
      setError('حداقل یک گزینه باید به عنوان پاسخ صحیح انتخاب شود');
      return;
    }

    try {
      const filteredOptions = formData.options.filter((o) => o.text.trim());
      
      if (editingQuestion) {
        await questionApi.updateQuestion(editingQuestion.id, {
          ...formData,
          options: filteredOptions,
        });
        setSuccess('سوال با موفقیت به‌روزرسانی شد');
      } else {
        await questionApi.createQuestion({
          ...formData,
          options: filteredOptions,
        });
        setSuccess('سوال با موفقیت ایجاد شد');
      }

      resetForm();
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این سوال اطمینان دارید؟')) return;

    try {
      await questionApi.deleteQuestion(id);
      setSuccess('سوال با موفقیت حذف شد');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      categoryId: question.categoryId,
      difficulty: question.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
      questionText: question.questionText,
      explanation: question.explanation || '',
      points: question.points,
      options: question.options.map((opt) => ({
        text: opt.text,
        order: opt.order,
        isCorrect: opt.isCorrect,
      })),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      categoryId: categories[0]?.id || 0,
      difficulty: 'MEDIUM',
      questionText: '',
      explanation: '',
      points: 10,
      options: [
        { text: '', order: 1, isCorrect: false },
        { text: '', order: 2, isCorrect: false },
        { text: '', order: 3, isCorrect: false },
        { text: '', order: 4, isCorrect: false },
      ],
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      EASY: 'آسان',
      MEDIUM: 'متوسط',
      HARD: 'سخت',
      EXPERT: 'خیلی سخت',
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">مدیریت سوالات</h1>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              + افزودن سوال جدید
            </button>
          </div>

          {error && (
            <ErrorMessage
              message={error}
              className="mb-4"
              onDismiss={() => setError(null)}
            />
          )}

          {success && (
            <SuccessMessage
              message={success}
              className="mb-4"
              onDismiss={() => setSuccess(null)}
            />
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              فیلتر بر اساس دسته‌بندی:
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="input w-full max-w-xs"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingQuestion ? 'ویرایش سوال' : 'افزودن سوال جدید'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    دسته‌بندی *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) })
                    }
                    className="input w-full"
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سطح سختی *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
                      })
                    }
                    className="input w-full"
                    required
                  >
                    <option value="EASY">آسان</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="HARD">سخت</option>
                    <option value="EXPERT">خیلی سخت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    متن سوال *
                  </label>
                  <textarea
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData({ ...formData, questionText: e.target.value })
                    }
                    className="input w-full min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) =>
                      setFormData({ ...formData, explanation: e.target.value })
                    }
                    className="input w-full min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    امتیاز *
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({ ...formData, points: parseInt(e.target.value, 10) })
                    }
                    className="input w-full"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    گزینه‌ها *
                  </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].isCorrect = e.target.checked;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].text = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`گزینه ${index + 1}`}
                        className="input flex-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingQuestion ? 'به‌روزرسانی' : 'ایجاد'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      متن سوال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      سطح
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      امتیاز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {question.id}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-md">
                        <div className="truncate">{question.questionText}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {categories.find((c) => c.id === question.categoryId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getDifficultyLabel(question.difficulty)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {question.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(question)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  هیچ سوالی یافت نشد
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

