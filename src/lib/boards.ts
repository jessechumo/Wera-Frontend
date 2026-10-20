import type { Company } from '../api/types';

/** Public careers page for a company's job board, from its ATS and token. */
export function boardURL(c: Pick<Company, 'ats' | 'token'>): string {
  const [host, rest] = c.token.split(/\/(.*)/s);
  switch (c.ats) {
    case 'greenhouse':
      return `https://job-boards.greenhouse.io/${c.token}`;
    case 'lever':
      return `https://jobs.lever.co/${c.token}`;
    case 'workday': // tenant.wdN/site
      return `https://${host}.myworkdayjobs.com/${rest ?? ''}`;
    case 'smartrecruiters':
      return `https://jobs.smartrecruiters.com/${c.token}`;
    case 'oracle': // host/site
      return `https://${host}.oraclecloud.com/hcmUI/CandidateExperience/en/sites/${rest ?? ''}`;
    case 'workable':
      return `https://apply.workable.com/${c.token}`;
    case 'rippling':
      return `https://ats.rippling.com/${c.token}/jobs`;
    case 'eightfold': // host/domain
      return `https://${host}/careers`;
    case 'amazon':
      return 'https://www.amazon.jobs/';
    default:
      return `https://jobs.ashbyhq.com/${c.token}`;
  }
}
