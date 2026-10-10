-- A small, fixed job board for end-to-end tests (idempotent).
INSERT INTO companies (name, ats, token, industry)
VALUES ('E2E Robotics', 'greenhouse', 'e2e-robotics', 'ai_ml')
ON CONFLICT (name) DO NOTHING;

INSERT INTO jobs (company_id, source, ext_id, title, location_raw, url, description, content_hash)
SELECT c.id, 'greenhouse', v.ext, v.title, v.loc, 'https://example.com/jobs/' || v.ext, v.descr, md5(v.ext || v.title)
FROM companies c,
  (VALUES
    ('e2e-1', 'Site Reliability Engineer', 'Remote, US',
     'About the role' || chr(10) || chr(10) || 'Keep our robot fleet services reliable with Go and Kubernetes.' || chr(10) || chr(10) || 'We sponsor visas for this role.'),
    ('e2e-2', 'Platform Engineer, New Grad', 'Austin, TX',
     'Build the internal platform our engineers deploy on. Terraform, Kubernetes, CI/CD.'),
    ('e2e-3', 'Senior Staff Site Reliability Engineer', 'Remote, US',
     'Lead reliability across the company. 10+ years of experience.')
  ) AS v(ext, title, loc, descr)
WHERE c.name = 'E2E Robotics'
ON CONFLICT DO NOTHING;
