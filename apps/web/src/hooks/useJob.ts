import { useQuery } from '@tanstack/react-query';
import type { Job } from '@basira/shared';
import { jobsApi } from '../api/pages.js';

/**
 * Poll a job until it reaches a terminal state. Pass `null` to disable.
 * (§9 — client tracks job status via polling.)
 */
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId as string),
    enabled: jobId !== null,
    refetchInterval: (q) => {
      const status = (q.state.data as Job | undefined)?.status;
      return status === 'done' || status === 'failed' ? false : 1200;
    },
  });
}
