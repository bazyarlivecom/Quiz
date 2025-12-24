import { CategoryRepository } from '../repositories/categoryRepository';
import { NotFoundError } from '../../../shared/utils/errors';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getAllCategories() {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) {
    return this.categoryRepository.create(categoryData);
  }

  async updateCategory(id: number, updates: Partial<{ name: string; description: string; icon: string; color: string }>) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.categoryRepository.update(id, updates);
  }
}

