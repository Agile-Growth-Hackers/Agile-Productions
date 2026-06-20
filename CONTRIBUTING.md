# Contributing to Agile Productions

Thank you for your interest in contributing to this project!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or fix
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes with clear, descriptive messages
7. Push to your fork
8. Submit a pull request

## Development Setup

This is a monorepo with two independent packages: `frontend/` (Next.js) and
`workers/` (Cloudflare Workers API). Install and run each separately.

```bash
# Frontend (Next.js) — http://localhost:3000
cd frontend
npm install
npm run dev

# Backend API (Cloudflare Workers) — http://localhost:8787
cd workers
npm install
npm run dev

# Tests
cd frontend && npm run test:e2e   # Playwright E2E
cd workers && npm test            # backend unit tests

# Build the frontend for production
cd frontend && npm run build
```

## Code Style

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Make sure your code follows the project's code style
4. Provide a clear description of the changes in your PR
5. Link any related issues

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser, etc.)

## Suggesting Enhancements

We welcome suggestions for enhancements! Please:

- Use a clear, descriptive title
- Provide a detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include examples if possible

## Questions?

If you have questions, please reach out at https://agilegrowthhackers.com

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
