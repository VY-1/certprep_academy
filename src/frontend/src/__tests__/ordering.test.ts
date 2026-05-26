import { describe, it, expect } from 'vitest';
import { orderVersions, extractNumericVersionId, Version } from '../utils/versions';

describe('version ordering', () => {
  it('extractNumericVersionId parses vN suffixes', () => {
    expect(extractNumericVersionId('ptcb-v1')).toBe(1);
    expect(extractNumericVersionId('ptcb-v11')).toBe(11);
    expect(extractNumericVersionId('ptcb-rand')).toBeNull();
  });

  it('orders versions: Quick, Focus, v1..vN, Rand, Full', () => {
    const input: Version[] = [
      { versionId: 'ptcb-v3' },
      { versionId: 'ptcb-full', title: 'Full Pool Exam' },
      { versionId: 'ptcb-v1' },
      { versionId: 'ptcb-rand', title: 'Randomized Practice' },
      { versionId: 'ptcb-daily', title: 'Daily Quiz — 25 Questions' },
      { versionId: 'ptcb-focus', title: 'Weak Areas Practice' },
      { versionId: 'ptcb-v2' },
    ];

    const out = orderVersions(input).map(v => v.versionId);
    expect(out).toEqual([
      'ptcb-daily',
      'ptcb-focus',
      'ptcb-v1',
      'ptcb-v2',
      'ptcb-v3',
      'ptcb-rand',
      'ptcb-full',
    ]);
  });
});
