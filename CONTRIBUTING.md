# راهنمای مشارکت در پروژه

## 📋 فهرست

1. [نحوه مشارکت](#نحوه-مشارکت)
2. [استانداردهای کد](#استانداردهای-کد)
3. [نحوه Commit](#نحوه-commit)
4. [نحوه Pull Request](#نحوه-pull-request)
5. [نحوه تست](#نحوه-تست)

---

## نحوه مشارکت

1. Fork کنید
2. Branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request باز کنید

---

## استانداردهای کد

### TypeScript
- استفاده از TypeScript strict mode
- تعریف types برای تمام functions
- استفاده از interfaces برای objects
- Avoid `any` type

### Code Style
- استفاده از ESLint و Prettier
- Format code قبل از commit
- استفاده از meaningful variable names
- Comment برای complex logic

### Backend
- Follow Repository → Service → Controller pattern
- استفاده از async/await
- Error handling در تمام layers
- Validation با Zod

### Frontend
- استفاده از functional components
- Custom hooks برای reusable logic
- TypeScript برای تمام components
- Responsive design

---

## نحوه Commit

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add refresh token functionality

fix(quiz): resolve timer issue on timeout

docs(readme): update setup instructions
```

---

## نحوه Pull Request

1. **Title**: واضح و توصیفی
2. **Description**: 
   - چه تغییری انجام شده
   - چرا این تغییر لازم بود
   - چگونه تست شده
3. **Checklist**:
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Code follows style guidelines
   - [ ] No breaking changes (or documented)

---

## نحوه تست

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Coverage
- حداقل 80% coverage برای new code
- تمام critical paths باید tested باشند

---

## Code Review

- تمام PRs باید reviewed شوند
- حداقل یک approval لازم است
- Address review comments قبل از merge

---

## Questions?

اگر سوالی دارید، issue باز کنید یا با maintainers تماس بگیرید.

---

**ممنون از مشارکت شما!** 🙏

