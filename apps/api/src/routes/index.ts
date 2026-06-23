import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './auth.routes.js';
import { projectRoutes } from './projects.routes.js';
import { manuscriptRoutes } from './manuscripts.routes.js';
import { pageRoutes } from './pages.routes.js';
import { transcriptionRoutes } from './transcriptions.routes.js';
import { translationRoutes } from './translations.routes.js';
import { annotationRoutes } from './annotations.routes.js';
import { searchRoutes } from './search.routes.js';
import { exportRoutes } from './exports.routes.js';
import { adminRoutes } from './admin.routes.js';
import { jobRoutes } from './jobs.routes.js';

/**
 * Central router. Each resource lives in its own thin route file (§4) and is
 * mounted here. Resource routers are added as their phases land.
 */
export const apiRouter: Router = Router();

apiRouter.use(healthRoutes);
apiRouter.use(authRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/manuscripts', manuscriptRoutes);
apiRouter.use('/pages', pageRoutes);
apiRouter.use('/transcriptions', transcriptionRoutes);
apiRouter.use('/translations', translationRoutes);
apiRouter.use('/annotations', annotationRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/exports', exportRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/jobs', jobRoutes);
