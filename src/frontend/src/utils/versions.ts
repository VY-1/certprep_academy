export type Version = {
  versionId: string;
  title?: string;
};

export function extractNumericVersionId(versionId: string): number | null {
  const m = versionId.match(/v(\d+)$/i);
  return m ? Number(m[1]) : null;
}

function isQuick(v: Version) {
  const id = v.versionId.toLowerCase();
  const t = (v.title || '').toLowerCase();
  return id.includes('quick') || id.includes('daily') || t.includes('daily quiz');
}
function isFocus(v: Version) {
  const id = v.versionId.toLowerCase();
  const t = (v.title || '').toLowerCase();
  return id.includes('focus') || t.includes('weak areas') || t.includes('weak areas practice');
}
function isRand(v: Version) {
  const id = v.versionId.toLowerCase();
  const t = (v.title || '').toLowerCase();
  return id.includes('rand') || t.includes('random');
}
function isFull(v: Version) {
  const id = v.versionId.toLowerCase();
  const t = (v.title || '').toLowerCase();
  return id.includes('full') || t.includes('full pool') || t.includes('all questions');
}

export function orderVersions(versions: Version[]): Version[] {
  const quick = versions.filter(isQuick);
  const focus = versions.filter(v => !isQuick(v) && isFocus(v));
  const numeric = versions
    .filter(v => !isQuick(v) && !isFocus(v) && extractNumericVersionId(v.versionId) !== null)
    .sort((a, b) => {
      const na = extractNumericVersionId(a.versionId) ?? Infinity;
      const nb = extractNumericVersionId(b.versionId) ?? Infinity;
      return na - nb;
    });
  const rand = versions.filter(v => !isQuick(v) && !isFocus(v) && extractNumericVersionId(v.versionId) === null && isRand(v));
  const full = versions.filter(v => !isQuick(v) && !isFocus(v) && extractNumericVersionId(v.versionId) === null && isFull(v));
  const others = versions.filter(v => !quick.includes(v) && !focus.includes(v) && !numeric.includes(v) && !rand.includes(v) && !full.includes(v));
  return [...quick, ...focus, ...numeric, ...rand, ...full, ...others];
}
