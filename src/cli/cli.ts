// The oclif commands making up the CLI

import {Command as SampleAppCommand} from "./commands/sample-app"
import {Command as SampleApp2Command} from "./commands/sample/sample-app-2"
import {Command as LocalServerCommand} from "./commands/local-server"
import {Command as BuildCodePipelineCommand} from "./commands/cdk/build-code-pipeline"

export const COMMANDS = {
  "sample-app": SampleAppCommand,
  "sample:sample-app-2": SampleApp2Command,
  "local-server": LocalServerCommand,
  "cdk:build-code-pipeline": BuildCodePipelineCommand,
}
