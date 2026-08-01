# Task: Backend Bottleneck Fix & Performance Optimization

- [x] Fix unreachable code and security headers in `src/middleware.ts`
- [x] Implement secure header-based auth pass-through in `src/middleware.ts`
- [x] Optimize `src/app/api/vendor/profile/route.ts` (remove redundant auth, fix prisma deadlock)
- [x] Optimize `src/app/api/vendor/auth/sessions/route.ts` (remove redundant auth)
- [x] Add performance tracing to optimized routes
- [x] Run `npm run build` to verify integrity
- [x] Run `npm run lint` to verify code quality
- [x] Measure and report API latency improvements
