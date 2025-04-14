// The oclif commands making up the CLI

import {Command as BuildCodePipelineCommand} from "./commands/cdk/build-code-pipeline"
import {Command as InfrastructureCommand} from "./commands/cdk/infrastructure"

export const COMMANDS = {
  "cdk:build-code-pipeline": BuildCodePipelineCommand,
  "cdk:infrastructure": InfrastructureCommand,
}
