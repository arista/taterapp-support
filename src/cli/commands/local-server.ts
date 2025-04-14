import * as OC from "@oclif/core"
import {LocalServer} from "@localserver/LocalServer"

export class Command extends OC.Command {
  static override description = "Run the local server"

  static override args = {}
  static override flags = {
    port: OC.Flags.custom<number>({
      char: "p",
      description: `The port number to run on`,
      required: true,
      parse: async (val) => parseInt(val),
    })(),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {port} = flags
    await LocalServer.start({port})
  }
}
