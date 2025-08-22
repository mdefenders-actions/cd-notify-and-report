# cd-notify-and-report

[![Test Coverage](./badges/coverage.svg)](./coverage/lcov-report/index.html)

A robust GitHub Action for sending workflow status notifications and logs to
[Grafana Loki](https://grafana.com/oss/loki/) and other observability platforms.
Designed for CI/CD pipelines, this action helps you track workflow executions,
durations, and outcomes in real time.

---

## Features

- Push workflow logs to Grafana Loki
- Configurable notification payloads
- Supports dry-run mode for safe testing
- TypeScript source, fully tested with Jest
- Easy integration with any workflow
- Comprehensive error handling and logging

---

## Marketplace Badge

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-View-blue?logo=github)](https://github.com/marketplace/actions/cd-notify-and-report)

---

## Usage

Add the following step to your workflow YAML:

```yaml
- name: Notify and Report to Loki
  uses: mdefenders-actions/cd-notify-and-report@v1
  with:
    start-time: ${{ needs.action-based-ci.outputs.start-time }} # recorded on a first step
    workflow-name: ${{ github.workflow }}
    workflow-success: ${{ job.status == 'success' && '1' || '0' }}
    loki-push-url: ${{ secrets.LOKI_PUSH_URL }}
    prom-push-token: ${{ secrets.PROM_PUSH_TOKEN }}
    app-name: my-app
    dry-run: false
```

### Required Inputs

| Name               | Description                          | Example                    |
| ------------------ | ------------------------------------ | -------------------------- |
| `start-time`       | Workflow start time (epoch seconds)  | `1692700000`               |
| `workflow-name`    | Name of the workflow                 | `CI Pipeline`              |
| `workflow-success` | `1` for success, `0` for failure     | `1`                        |
| `loki-push-url`    | Loki push API endpoint               | `https://loki.example.com` |
| `prom-push-token`  | Basic auth token for Loki            | `mysecrettoken`            |
| `app-name`         | Application name for log stream      | `my-app`                   |
| `dry-run`          | If `true`, logs are not sent to Loki | `false`                    |

---

## Example Workflow

```yaml
name: CI Notify and Report

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          persist-credentials: false

      - name: Notify and Report to Loki
        uses: mdefenders-actions/cd-notify-and-report@v1
        with:
          start-time: ${{ github.event.workflow_run.created_at }}
          workflow-name: ${{ github.workflow }}
          workflow-success: ${{ job.status == 'success' && '1' || '0' }}
          loki-push-url: ${{ secrets.LOKI_PUSH_URL }}
          prom-push-token: ${{ secrets.PROM_PUSH_TOKEN }}
          app-name: my-app
          dry-run: false
```

---

## Outputs

This action does not set outputs, but logs all relevant information using GitHub
Actions logging. Errors are surfaced in the workflow run.

---

## Security

- Uses `persist-credentials: false` for all `actions/checkout` steps to prevent
  credential leakage.
- Sensitive tokens should be stored in GitHub Secrets.

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Testing

```bash
npm run test
```

### Bundling

After making changes to TypeScript sources in `src/`, run:

```bash
npm run bundle
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Write tests for your changes.
4. Run `npm run test` and ensure all tests pass.
5. Run `npm run bundle` to update the `dist` directory.
6. Submit a pull request with a clear description.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Support

For questions, issues, or feature requests, please open an
[issue](https://github.com/mdefenders-actions/cd-notify-and-report/issues) on
GitHub.

---

## Maintainers

- [mdefenders](https://github.com/mdefenders)

---

**Ready to improve your CI/CD observability?
[Get started on GitHub Marketplace!](https://github.com/marketplace/actions/cd-notify-and-report)**
