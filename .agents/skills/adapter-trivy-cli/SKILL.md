---
name: trivy-cli
description: CLI reference and operational guide for Trivy — a comprehensive vulnerability scanner for filesystem, container images, and IaC. Returns structured JSON for agentic consumption.
layer: global
permissions:
  shell: true
  files:
    read: ["**"]
    write: ["reports/security/**"]
    deny_write: ["AGENTS.md", "packages/agents/**", ".agents/skills/adapter-**/*.md", ".agents/skills/skill-**/*.md", ".agents/skills/playbook-**/*.md"]
  network:
    allow: ["ghcr.io", "pkg-containers.githubusercontent.com"]
interfaces:
  - id: scan-type
    description: Filesystem, image, or config scan mode.
    required: true
    type: string
    examples: [fs, image, config]
  - id: target
    description: Path or container image to scan.
    required: true
    type: string
    examples: [., ghcr.io/acme/api:latest]
  - id: severity-filter
    description: Optional severity filter such as CRITICAL,HIGH,MEDIUM.
    required: false
    type: string
    examples: [CRITICAL,HIGH, CRITICAL,HIGH,MEDIUM]
  - id: output-format
    description: Optional output format such as json, sarif, or cyclonedx.
    required: false
    type: string
    examples: [json, sarif, cyclonedx]
---

# Trivy CLI

Trivy is an all-in-one security scanner. It detects vulnerabilities (CVEs), misconfigurations, secrets, and license issues in filesystems, container images, and IaC files.

Declare `scan-type` first so the adapter knows whether it is scanning a filesystem, image, or config target, point `target` at the repository path or image name, narrow results with `severity-filter` when triage must focus, and choose `output-format` when downstream tooling expects JSON, SARIF, or CycloneDX.

## Available Commands

- **`cmd/scan.mjs`** — Run the configured `scan-type` against the chosen `target`, outputting a structured summary to stdout

## 1. Core Commands

### Filesystem Scan (primary use case)

```bash
# Use the bundled command (auto-detects .trivy.yaml/.trivy.yml if present)
node cmd/scan.mjs

# With `severity-filter` and only fixable CVEs
node cmd/scan.mjs --severity CRITICAL,HIGH --ignore-unfixed

# Save full report to a chosen `output-format` destination file
node cmd/scan.mjs --output reports/security/report.json

# Raw trivy (if config exists)
trivy fs . --config .trivy.yaml --skip-version-check --format json

# Raw trivy (no config)
trivy fs . --severity CRITICAL,HIGH --format json
```

### Container Image Scan

```bash
# Scan an image `target`
trivy image ghcr.io/<org>/<repo>/ci-runner:latest --format json

# Scan a config `target` such as a local Dockerfile (IaC misconfigurations)
trivy config Dockerfile.ci --format json
```

### SBOM Generation

```bash
# Generate CycloneDX SBOM
trivy fs . --format cyclonedx --output sbom.json
```

## 2. Output Formats

### JSON Structure (filesystem scan)

The `--format json` output structure:

```json
{
  "SchemaVersion": 2,
  "Results": [
    {
      "Target": "package-lock.json",
      "Class": "lang-pkgs",
      "Type": "npm",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2024-XXXXX",
          "PkgName": "lodash",
          "InstalledVersion": "4.17.20",
          "FixedVersion": "4.17.21",
          "Severity": "HIGH",
          "Title": "Prototype Pollution",
          "Description": "...",
          "CVSS": {
            "nvd": { "V3Score": 7.5 }
          }
        }
      ]
    }
  ]
}
```

### Severity Levels

| Level | Meaning | Action |
| --- | --- | --- |
| CRITICAL | Actively exploited or trivially exploitable | **Block merge.** Must fix immediately. |
| HIGH | Exploitable with some effort | **Block merge.** Prioritize fix. |
| MEDIUM | Exploitable under specific conditions | Report. Fix if update is compatible. |
| LOW | Theoretical or requires unlikely conditions | Report only. |
| UNKNOWN | Severity not yet assigned by NVD | Treat as MEDIUM until classified. |

### Exit Codes

| Code | Meaning |
| --- | --- |
| 0 | No vulnerabilities found at configured severity |
| 1 | Vulnerabilities found at or above configured severity threshold |
| 2 | Trivy internal error (misconfiguration, network issue) |

## 3. Configuration (`.trivy.yaml`)

The project-level `.trivy.yaml` controls default behavior:

```yaml
# Exit with code 1 when HIGH or CRITICAL found
exit-code: 1

# Only fail on these severities
severity:
  - HIGH
  - CRITICAL

# Skip directories not relevant to security
skip-dirs:
  - node_modules
  - .next
  - dist
  - build
  - .turbo
  - .vercel
  - reports
  - coverage
```

**Key flags:**

| Flag | Purpose |
| --- | --- |
| `--config .trivy.yaml` | Use project config (if present) |
| `--skip-version-check` | Don't check for trivy updates (faster) |
| `--format json` | Machine-readable output |
| `--output <file>` | Write to file instead of stdout |
| `--severity CRITICAL,HIGH` | Override config severity filter |
| `--ignore-unfixed` | Only show CVEs with available fixes |

## 4. Integration with Dependency Updates

When used during dependency updates, trivy answers:

1. **Before update:** Which CVEs exist in current dependencies?
2. **After update:** Did the update resolve any CVEs? Did it introduce new ones?
3. **Prioritization:** Which outdated packages have known CVEs? (Update those first.)

### Workflow Pattern

```bash
# 1. Baseline scan (before updates)
node cmd/scan.mjs > /tmp/before.json

# 2. Apply updates...

# 3. Post-update scan
node cmd/scan.mjs > /tmp/after.json

# 4. Compare: agent uses jq to diff vulnerability counts
```

### Interpreting Results for Update Priority

- Package has CRITICAL/HIGH CVE with `FixedVersion` → **Update immediately**
- Package has MEDIUM CVE with `FixedVersion` → **Include in batch update**
- Package has CVE but no `FixedVersion` → **Track in issue, don't block**
- Package outdated but no CVEs → **Update at normal priority**

## 5. CI Integration

Common CI pattern (adapt to your pipeline):

```bash
mkdir -p reports/security && \
  node .agents/skills/adapter-trivy-cli/cmd/scan.mjs \
    --output reports/security/report.json || true
```

Or reference the scan script from a `package.json` script:

```json
"security": "node .agents/skills/adapter-trivy-cli/cmd/scan.mjs"
```

## 6. Troubleshooting

| Problem | Solution |
| --- | --- |
| "trivy: command not found" | Install via `brew install trivy` or check Dockerfile.ci |
| Scan takes too long | Add more `skip-dirs` to `.trivy.yaml` |
| False positives | Use `.trivyignore` file with CVE IDs to suppress |
| DB download fails | Use `--skip-db-update` with pre-cached DB, or check network |
| Exit code 1 but no output | Increase severity: `--severity LOW,MEDIUM,HIGH,CRITICAL` |

## 7. Agent Hints

- **Always use `--format json`** for programmatic consumption. Never parse table output.
- **Use the bundled command** (`node cmd/scan.mjs`) instead of raw trivy commands — it auto-detects `.trivy.yaml`/`.trivy.yml` config, handles edge cases, and returns a normalized summary.
- **Compare before/after** when doing dependency updates to prove CVE resolution.
- **`FixedVersion` is key** — only flag packages where a fix exists. Unfixed CVEs are informational only.

## External References

- [Trivy documentation](https://aquasecurity.github.io/trivy/)
- [Trivy CLI reference](https://aquasecurity.github.io/trivy/latest/docs/references/configuration/cli/trivy/)
- [Trivy — GitHub](https://github.com/aquasecurity/trivy)
