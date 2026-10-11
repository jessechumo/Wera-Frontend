import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import { wageLevelFor } from '../api/h1b';
import { JobH1B } from './JobH1B';

const period = { from: '2025-07-01T00:00:00Z', to: '2026-06-30T00:00:00Z' };

describe('JobH1B', () => {
  it("shows the company's filings and wages for similar titles", async () => {
    stubApi({
      'GET /api/jobs/7/h1b': (_init, url) => ({
        matched: url.searchParams.get('level') === 'I', company_id: 1, filings: 294, new_hires: 112, wage_median: 163322, period,
        similar: [{ title: 'Software Engineer', wage_from: 156800, wage_to: 200000, level: 'II', place: 'Seattle, WA', date: '2026-03-01' }],
        similar_low: 140000, similar_median: 156800, similar_high: 210000, level: 'I',
      }),
    });
    renderApp(<JobH1B jobId={7} company="Stripe" seniority="entry" />);
    expect(await screen.findByText('294')).toBeInTheDocument();
    expect(screen.getByText('$140k – $210k')).toBeInTheDocument();
    expect(screen.getByText(/at wage level I \(entry\)/)).toBeInTheDocument();
    expect(screen.getByText('$157k–200k')).toBeInTheDocument();
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument();
  });

  it('says when no filings match the company', async () => {
    stubApi({ 'GET /api/jobs/7/h1b': () => ({ matched: false, company_id: 1, filings: 0, new_hires: 0, wage_median: null, similar: [], level: '', period }) });
    renderApp(<JobH1B jobId={7} company="Acme" />);
    expect(await screen.findByText(/No H-1B applications found under Acme/)).toBeInTheDocument();
  });

  it('maps seniority to a wage level', () => {
    expect(['entry', 'mid', 'senior', 'staff', null].map(wageLevelFor)).toEqual(['I', 'II', 'III', 'IV', '']);
  });
});
