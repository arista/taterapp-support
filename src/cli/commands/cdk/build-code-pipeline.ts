import * as OC from "@oclif/core"
import * as BuildCodePipeline from "@lib/cdk/BuildCodePipeline"

export class Command extends OC.Command {
  static override description =
    "Manages the CDK stack that handles the CodePipeline for building the application"

  static override args = {
    "cdk-command": OC.Args.string({
      description: `The CDK command to execute (deploy, destroy, etc.)`,
      required: true,
    }),
  }
  static override flags = {
    branch: OC.Flags.string({
      char: "b",
      description: `The branch for which the pipeline should be created`,
      required: false,
      default: "main",
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const cdkCommand = args["cdk-command"]
    const {branch} = flags
    const stackProps: BuildCodePipeline.StackProps = {branch}
    await BuildCodePipeline.Stack.runCDKCommand({
      cdkCommand,
      stackProps,
    })
  }
}
