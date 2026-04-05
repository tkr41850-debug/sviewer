/**
 * MainChart is now a backward-compatible re-export of RechartsAdapter.
 * The Recharts rendering logic has been moved to RechartsAdapter.tsx
 * to implement the ChartAdapterProps interface for dual-engine support.
 */
export { RechartsAdapter as MainChart } from './RechartsAdapter';
