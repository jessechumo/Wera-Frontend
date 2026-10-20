import { describe, expect, it } from 'vitest';
import { boardURL } from './boards';

describe('boardURL', () => {
  it('links each ATS to its public board', () => {
    expect(boardURL({ ats: 'greenhouse', token: 'stripe' })).toBe('https://job-boards.greenhouse.io/stripe');
    expect(boardURL({ ats: 'ashby', token: 'openai' })).toBe('https://jobs.ashbyhq.com/openai');
    expect(boardURL({ ats: 'workday', token: 'ccf.wd1/ClevelandClinicCareers' })).toBe('https://ccf.wd1.myworkdayjobs.com/ClevelandClinicCareers');
    expect(boardURL({ ats: 'oracle', token: 'jpmc.fa/CX_1001' })).toBe('https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001');
    expect(boardURL({ ats: 'smartrecruiters', token: 'BoschGroup' })).toBe('https://jobs.smartrecruiters.com/BoschGroup');
    expect(boardURL({ ats: 'workable', token: 'thorlabs' })).toBe('https://apply.workable.com/thorlabs');
    expect(boardURL({ ats: 'rippling', token: 'riot-platforms-careers' })).toBe('https://ats.rippling.com/riot-platforms-careers/jobs');
    expect(boardURL({ ats: 'eightfold', token: 'explore.jobs.netflix.net/netflix.com' })).toBe('https://explore.jobs.netflix.net/careers');
    expect(boardURL({ ats: 'amazon', token: 'USA' })).toBe('https://www.amazon.jobs/');
  });
});
