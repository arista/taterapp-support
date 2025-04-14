import {Construct, IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as Utils from "../Utils"
import {CDKPermissionsUtils} from "./CDKPermissionsUtils"
import {CDKResourcesUtils} from "./CDKResourcesUtils"
import {CDKRecipes} from "./CDKRecipes"

export class CDKUtils {
  constructor(
    public props: {
      scope: IConstruct
    }
  ) {}

  get scope() {
    return this.props.scope
  }

  _permissions: CDKPermissionsUtils | null = null
  get permissions(): CDKPermissionsUtils {
    return (this._permissions ||= (() => {
      return new CDKPermissionsUtils()
    })())
  }

  _resources: CDKResourcesUtils | null = null
  get resources(): CDKResourcesUtils {
    return (this._resources ||= (() => {
      return new CDKResourcesUtils({
        scope: this.scope,
      })
    })())
  }

  _recipes: CDKRecipes | null = null
  get recipes(): CDKRecipes {
    return (this._recipes ||= (() => {
      return new CDKRecipes()
    })())
  }

  static async runCDKCommand<P extends Object>({
    appPkgDir,
    appClass,
    cdkCommand,
    stackProps,
  }: {
    appPkgDir: string
    appClass: string
    cdkCommand: string
    stackProps: P
  }): Promise<void> {
    // This assumes that all the devops-utils code has been rolled up
    // into build/rollup/index.cjs
    const nodeFile = `${appPkgDir}/dist/lib/lib.es.js`
    const nodeCommand = `node -e "import('${nodeFile}').then(i=>i.${appClass}.runCDKStack())"`
    const timestamp = Utils.dateToYYYYMMDDHHMMSS()
    const cdkOutputDir = `${appPkgDir}/build/cdk.out/${appClass}/${timestamp}`

    const command = "npx"
    const shell = false

    const stackPropsJson: string = JSON.stringify(stackProps)
    const env: {[name: string]: string} = {
      CDK_PROPS: stackPropsJson,
      ...process.env,
    }

    const args = []
    args.push(`cdk`)
    args.push(`--app`, nodeCommand)
    args.push(`-o`, cdkOutputDir)
    args.push(cdkCommand)
    // Don't ask for approval (usually would ask for security-related
    // changes, like security groups)
    args.push(`--require-approval`, `never`)
    // Force a redeploy, even if the template is the same
    args.push(`--force`)
    //args.push(`--progress`, `events`)

    return await Utils.runShellCommand({
      command,
      args,
      env,
      shell,
      cwd: appPkgDir,
    })
  }

  static runCDKStack<P>({
    getStackName,
    buildStack,
  }: {
    getStackName: ({stackProps}: {stackProps: P}) => string
    buildStack: ({
      parent,
      stackProps,
    }: {
      parent: IConstruct
      stackProps: P
    }) => void
  }) {
    const env = JSON.parse(Utils.notNull(process.env["CDK_PROPS"]))
    const stackProps: P = env
    const stackName = getStackName({stackProps})
    const app = new cdk.App()
    const stack = new cdk.Stack(app, stackName, {
      // This enables things like looking up hostnames.  Note that
      // these don't have to be defined as environment variables - CDK
      // will figure them out itself based on the AWS configuration
      env: {
        account: process.env["CDK_DEFAULT_ACCOUNT"],
        region: process.env["CDK_DEFAULT_REGION"],
      },
    })
    buildStack({parent: stack, stackProps})
  }

  //--------------------------------------------------
}
