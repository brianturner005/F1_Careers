// Single bundling entry point: importing every function file for its
// side-effect `app.http(...)` registration call lets esbuild produce one
// self-contained deploy artifact (see package.json's "build" script and
// .github/workflows/deploy.yml) instead of needing node_modules with the
// npm-workspace-local @f1-job-radar/* packages resolvable at the deploy target.
import './functions/createSavedSearch.js';
import './functions/deleteSavedSearch.js';
import './functions/getHiringTrends.js';
import './functions/getJobs.js';
import './functions/getMe.js';
import './functions/getNewThisWeek.js';
import './functions/getSavedSearches.js';
import './functions/getSources.js';
import './functions/logout.js';
import './functions/requestMagicLink.js';
import './functions/verifyMagicLink.js';
