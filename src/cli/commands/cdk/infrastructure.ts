import * as OC from "@oclif/core"
import * as Infrastructure from "@lib/cdk/Infrastructure"

export class Command extends OC.Command {
  static override description =
    "Manages the CDK stack that handles the Taterapp infrastructur"

  static override args = {
    "cdk-command": OC.Args.string({
      description: `The CDK command to execute (deploy, destroy, etc.)`,
      required: true,
    }),
  }
  static override flags = {
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const cdkCommand = args["cdk-command"]
    const stackProps: Infrastructure.StackProps = {}
    await Infrastructure.Stack.runCDKCommand({
      cdkCommand,
      stackProps,
    })
  }
}
