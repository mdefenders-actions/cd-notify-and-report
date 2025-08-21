# From https://gist.github.com/mpneuried/0594963ad38e68917ef189b4e6a269db

# HELP
# This will output the help for each task
# thanks to https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.PHONY: help coverage

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

# Actions tasks

install: ## Install dependencies
	npm install
run: ## Run the action code
	npx local-action . src/main.ts .env
build: ## Build the Dist JS
	npm run bundle
test: ## Run the tests
	npm run test
coverage: ## Run the tests with coverage
	npm run coverage
all: # Run all tasks
	npm run all
