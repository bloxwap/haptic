/** The subset of npm ranges these checks compare. Unknown syntax fails closed. */

function parseVersion(text) {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/.exec(text);
  if (!match) throw new Error(`Unsupported version: ${text}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    prerelease: match[4] ?? null,
  };
}

function compare(left, right) {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  if (left.patch !== right.patch) return left.patch - right.patch;
  if (left.prerelease === right.prerelease) return 0;
  if (left.prerelease && !right.prerelease) return -1;
  if (!left.prerelease && right.prerelease) return 1;
  return left.prerelease < right.prerelease ? -1 : 1;
}

function caret(version, base) {
  if (version.prerelease && !base.prerelease) return false;
  if (compare(version, base) < 0) return false;
  if (base.major > 0) return version.major === base.major;
  if (base.minor > 0) return version.major === 0 && version.minor === base.minor;
  return version.major === 0 && version.minor === 0 && version.patch === base.patch;
}

function tilde(version, base) {
  if (version.prerelease && !base.prerelease) return false;
  return compare(version, base) >= 0 && version.major === base.major && version.minor === base.minor;
}

function satisfiesToken(versionText, token) {
  const match = /^(>=|<=|>|<|\^|~|=)?(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?)$/.exec(token);
  if (!match) throw new Error(`Unsupported version range token: ${token}`);
  const operator = match[1] ?? '=';
  if ((operator === '^' || operator === '~') && !/^\d+\.\d+\.\d+(?:-|$)/.test(match[2])) {
    throw new Error(`Unsupported version range token: ${token}`);
  }
  const version = parseVersion(versionText);
  const base = parseVersion(match[2]);
  if (version.prerelease && !base.prerelease && operator !== '^' && operator !== '~') return false;
  const order = compare(version, base);
  if (operator === '^') return caret(version, base);
  if (operator === '~') return tilde(version, base);
  if (operator === '>=') return order >= 0;
  if (operator === '<=') return order <= 0;
  if (operator === '>') return order > 0;
  if (operator === '<') return order < 0;
  return order === 0;
}

export function satisfies(version, range) {
  const alternatives = range.split('||').map(part => part.trim()).filter(Boolean);
  if (alternatives.length === 0) throw new Error(`Empty version range: ${range}`);
  return alternatives.some(alternative => alternative.split(/\s+/).every(token => satisfiesToken(version, token)));
}
