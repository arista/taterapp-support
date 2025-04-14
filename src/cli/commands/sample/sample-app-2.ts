import * as OC from "@oclif/core"
import {SampleAppLib} from "@lib/SampleAppLib"

export class Command extends OC.Command {
  static override description = "SampleApp2 command"

  static override args = {
    arg1: OC.Args.string({
      description: `The first arg`,
      required: true,
    }),
  }
  static override flags = {
    flag1: OC.Flags.custom<number>({
      char: "f",
      description: `The first flag`,
      required: false,
      parse: async (val) => parseInt(val),
      default: 20,
    })(),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {arg1} = args
    const {flag1} = flags
    return await new SampleAppLib().add2(3, flag1)
  }
}
